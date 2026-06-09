import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeLocally } from "../server/analyzer.mjs";
import { TOPICS } from "../server/concepts.mjs";
import { finalizeFeedback, computeMastery } from "../server/schema.mjs";

describe("concepts bank", () => {
  it("has 20 bundled topics", () => {
    assert.equal(Object.keys(TOPICS).length, 20);
  });
});

describe("analyzeLocally — photosynthesis", () => {
  it("flags missing concepts on sparse explanation", () => {
    const result = analyzeLocally({
      topic: "photosynthesis",
      text: "plants use sunlight",
      nodes: [{ id: "n1", text: "sunlight" }],
      edges: [],
      attemptNumber: 2,
      unlockModelAnswer: false,
      previousScore: null,
    });
    assert.ok(result.score < 80);
    assert.ok(result.items.some((i) => i.kind === "missing"));
    assert.ok(result.suggestedNodes.length > 0);
  });

  it("detects soil misconception", () => {
    const result = analyzeLocally({
      topic: "photosynthesis",
      text: "plants eat soil for food",
      nodes: [{ id: "n1", text: "plants eat soil for food" }],
      edges: [],
      attemptNumber: 2,
      unlockModelAnswer: false,
      previousScore: null,
    });
    assert.ok(result.items.some((i) => i.kind === "misconception"));
    assert.equal(result.items.find((i) => i.kind === "misconception")?.nodeId, "n1");
  });

  it("withholds model answer on first attempt", () => {
    const result = analyzeLocally({
      topic: "photosynthesis",
      text: "sunlight chlorophyll carbon dioxide water glucose oxygen",
      nodes: [],
      edges: [],
      attemptNumber: 1,
      unlockModelAnswer: false,
      previousScore: null,
    });
    assert.equal(result.modelAnswer, null);
  });

  it("shows model answer on second attempt", () => {
    const result = analyzeLocally({
      topic: "photosynthesis",
      text: "sunlight chlorophyll carbon dioxide water glucose oxygen",
      nodes: [],
      edges: [],
      attemptNumber: 2,
      unlockModelAnswer: false,
      previousScore: 40,
    });
    assert.ok(result.modelAnswer);
    assert.equal(result.previousScore, 40);
  });
});

describe("computeMastery", () => {
  it("requires high score and no misconceptions", () => {
    const m = computeMastery(85, [
      { kind: "good", title: "A" },
      { kind: "missing", title: "Missing: X" },
    ]);
    assert.equal(m.achieved, true);
  });

  it("fails with misconception", () => {
    const m = computeMastery(90, [{ kind: "misconception", title: "Wrong" }]);
    assert.equal(m.achieved, false);
  });
});

describe("finalizeFeedback", () => {
  it("caps items at 8", () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      kind: "missing",
      title: `Missing ${i}`,
      detail: "hint",
      nodeId: null,
      span: null,
    }));
    const out = finalizeFeedback(
      { provider: "local", topicLabel: "T", score: 50, summary: "s", items, followUp: "q", modelAnswer: "a" },
      { attemptNumber: 2, text: "", nodes: [] }
    );
    assert.ok(out.items.length <= 8);
  });
});
