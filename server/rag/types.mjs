/** @typedef {"concept" | "misconception" | "model_answer" | "topic_overview" | "excerpt"} ChunkType */

/**
 * @typedef {object} KnowledgeChunk
 * @property {string} chunkId
 * @property {string} topicKey
 * @property {string} topicLabel
 * @property {string[]} topicAliases
 * @property {ChunkType} type
 * @property {string | null} entityId
 * @property {number | null} importance
 * @property {string[]} keywords
 * @property {string[]} matchPhrases
 * @property {string} title
 * @property {string} text
 * @property {string} [hint]
 * @property {string} [correction]
 * @property {string} [modelAnswer]
 */

/**
 * @typedef {object} FeedbackPayload
 * @property {string} topic
 * @property {"mindmap" | "text"} mode
 * @property {string} text
 * @property {{ id: string, text: string }[]} nodes
 */

/**
 * @typedef {object} QueryPlan
 * @property {string} intent
 * @property {string} topic
 * @property {string | null} topicKey
 * @property {{ text: string, weight: number, role: string }[]} queries
 * @property {{ topicKey: string | null, types: ChunkType[] }} filters
 * @property {number} topK
 */

/**
 * @typedef {KnowledgeChunk & { score: number, rank: number, source: "dense" | "sparse" }} RetrievalHit
 */

/**
 * @typedef {RetrievalHit & { rerankScore: number, fusionScore: number }} RankedChunk
 */

/**
 * @typedef {object} HighlightConcept
 * @property {string} entityId
 * @property {string} label
 * @property {string} hint
 * @property {number} importance
 * @property {string[]} keywords
 */

/**
 * @typedef {object} HighlightMisconception
 * @property {string} entityId
 * @property {string} label
 * @property {string} correction
 * @property {string[]} match
 */

/**
 * @typedef {object} HighlightIndex
 * @property {string} topicKey
 * @property {string} topicLabel
 * @property {string} modelAnswer
 * @property {HighlightConcept[]} concepts
 * @property {HighlightMisconception[]} misconceptions
 */

/**
 * @typedef {object} AssembledContext
 * @property {string} promptSection
 * @property {HighlightIndex} highlightIndex
 * @property {number} tokenCount
 * @property {string[]} includedChunkIds
 * @property {boolean} truncated
 * @property {string} topicLabel
 * @property {number} topicMatch
 */

/**
 * @typedef {object} RetrievalResult
 * @property {string | null} resolvedTopicKey
 * @property {string} resolvedTopicLabel
 * @property {"high" | "medium" | "low"} topicConfidence
 * @property {null | "generic"} fallback
 * @property {RankedChunk[]} chunks
 * @property {RankedChunk[]} matchedConcepts
 * @property {RankedChunk[]} matchedMisconceptions
 */

/**
 * @typedef {object} PipelineMeta
 * @property {string} requestId
 * @property {string} degradationPath
 * @property {number} hitCount
 * @property {number} totalMs
 * @property {Record<string, { ms: number, ok: boolean }>} stages
 */

export {};
