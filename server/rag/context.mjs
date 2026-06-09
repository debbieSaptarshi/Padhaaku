/**
 * @param {string} text
 */
export function estimateTokens(text) {
  return Math.ceil((text || "").length / 4);
}

/**
 * @param {import("./types.mjs").RankedChunk[]} chunks
 * @param {{ topic: string, topicLabel: string, topicMatch: number, budget?: number }} opts
 * @returns {import("./types.mjs").AssembledContext | null}
 */
export function assembleContext(chunks, opts) {
  const budget = opts.budget ?? 2800;
  if (!chunks.length) return null;

  const topicKey = opts.topicKey || chunks.find((c) => c.topicKey)?.topicKey || "";
  const scoped = topicKey ? chunks.filter((c) => c.topicKey === topicKey) : chunks;

  const misconceptions = scoped.filter((c) => c.type === "misconception");
  const concepts = scoped.filter((c) => c.type === "concept");
  const modelAnswer = scoped.find((c) => c.type === "model_answer");
  const overview = scoped.find((c) => c.type === "topic_overview");

  const topicLabel = opts.topicLabel || overview?.topicLabel || opts.topic;

  let used = 0;
  const included = [];
  const parts = [];

  parts.push(`## Topic\n"${opts.topic}" (knowledge base: ${topicLabel})`);

  const addSection = (heading, items, maxEach) => {
    if (!items.length) return;
    const lines = [`\n## ${heading}`];
    for (const item of items) {
      const line = formatChunk(item, maxEach);
      const tokens = estimateTokens(line);
      if (used + tokens > budget) break;
      lines.push(line);
      used += tokens;
      included.push(item.chunkId);
    }
    if (lines.length > 1) parts.push(lines.join("\n"));
  };

  addSection("Watch for these misconceptions", misconceptions, 120);
  addSection("Rubric: concepts a strong explanation should cover", concepts, 100);

  if (modelAnswer) {
    const line = `\n## Model answer reference (internal — do not quote verbatim to the learner)\n${truncate(modelAnswer.text, 200)}`;
    const tokens = estimateTokens(line);
    if (used + tokens <= budget) {
      parts.push(line);
      used += tokens;
      included.push(modelAnswer.chunkId);
    }
  }

  const promptSection = `${parts.join("\n")}\n\n---\nAssess the learner using the rubric above. For misconceptions, set span to an EXACT substring of their text. Set nodeId when a mind-map node matches.`;

  const highlightIndex = buildHighlightIndex(scoped, topicKey, topicLabel, modelAnswer?.text || "");

  return {
    promptSection,
    highlightIndex,
    tokenCount: used,
    includedChunkIds: included,
    truncated: used >= budget * 0.95,
    topicLabel,
    topicMatch: opts.topicMatch,
  };
}

/**
 * @param {import("./types.mjs").RankedChunk} chunk
 * @param {number} maxTokens
 */
function formatChunk(chunk, maxTokens) {
  if (chunk.type === "misconception") {
    return `- [${chunk.entityId}] ${chunk.title}\n  Trigger phrases: ${chunk.matchPhrases.join("; ")}\n  Correction: "${chunk.correction || chunk.text}"`;
  }
  if (chunk.type === "concept") {
    return `- [${chunk.entityId}] ${chunk.title} (importance: ${chunk.importance || 1}/3)\n  Hint if missing: "${chunk.hint || ""}"\n  Keywords: ${chunk.keywords.join(", ")}`;
  }
  return `- ${chunk.title}: ${truncate(chunk.text, maxTokens)}`;
}

function truncate(text, maxTokens) {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "…";
}

/**
 * @param {import("./types.mjs").RankedChunk[]} chunks
 */
function buildHighlightIndex(chunks, topicKey, topicLabel, modelAnswer) {
  return {
    topicKey,
    topicLabel,
    modelAnswer,
    concepts: chunks
      .filter((c) => c.type === "concept")
      .map((c) => ({
        entityId: c.entityId,
        label: c.title,
        hint: c.hint || "",
        importance: c.importance || 1,
        keywords: c.keywords,
      })),
    misconceptions: chunks
      .filter((c) => c.type === "misconception")
      .map((c) => ({
        entityId: c.entityId,
        label: c.title,
        correction: c.correction || c.text,
        match: c.matchPhrases,
      })),
  };
}

/**
 * @param {import("./types.mjs").AssembledContext | null} ctx
 * @param {import("./config.mjs").loadRagConfig extends () => infer R ? R : never} config
 */
export function shouldUseRAG(ctx, config) {
  if (!ctx) return false;
  if (ctx.topicMatch < config.minTopicMatch) return false;
  if (ctx.highlightIndex.concepts.length < 2 && ctx.highlightIndex.misconceptions.length < 1) return false;
  return true;
}
