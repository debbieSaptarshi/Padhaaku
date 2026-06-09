/** @typedef {"concept" | "misconception" | "model_answer" | "topic_meta"} ChunkType */

/**
 * @typedef {object} ContextChunk
 * @property {string} chunkId
 * @property {string} topicId
 * @property {string} topicLabel
 * @property {ChunkType} type
 * @property {string} title
 * @property {string} body
 * @property {string[]} keywords
 * @property {number} [importance]
 * @property {string[]} [matchPhrases]
 * @property {string} [correction]
 * @property {string} [hint]
 */

/**
 * @typedef {object} FeedbackPayload
 * @property {string} topic
 * @property {"mindmap" | "text"} mode
 * @property {string} text
 * @property {{ id: string, text: string }[]} nodes
 */

/**
 * @typedef {object} RouterResult
 * @property {string | null} topicId
 * @property {string} topicLabel
 * @property {string[]} queries
 * @property {{ types: ChunkType[] }} chunkFilters
 * @property {"known" | "inferred" | "unknown"} confidence
 */

/**
 * @typedef {object} ScoredChunk
 * @property {ContextChunk} chunk
 * @property {number} score
 * @property {number} [sparseScore]
 * @property {number} [denseScore]
 * @property {number} [rrfScore]
 */

/**
 * @typedef {object} RetrievalResult
 * @property {ScoredChunk[]} chunks
 * @property {"hybrid" | "sparse" | "dense" | "none"} mode
 */

/**
 * @typedef {object} FeedbackItem
 * @property {"good" | "incomplete" | "misconception" | "missing"} kind
 * @property {string} title
 * @property {string} detail
 * @property {string | null} nodeId
 * @property {string | null} span
 * @property {string} [source]
 */

/**
 * @typedef {object} AssessmentResult
 * @property {number} score
 * @property {FeedbackItem[]} items
 * @property {string} topicLabel
 */

/**
 * @typedef {object} CoachingResult
 * @property {string} summary
 * @property {string} followUp
 * @property {string} modelAnswer
 */

/**
 * @typedef {object} PipelineState
 * @property {FeedbackPayload} payload
 * @property {RouterResult} route
 * @property {RetrievalResult} retrieval
 * @property {AssessmentResult} assessment
 * @property {CoachingResult} coaching
 */

/**
 * @typedef {object} FeedbackResponse
 * @property {string} provider
 * @property {string} topicLabel
 * @property {number} score
 * @property {string} summary
 * @property {FeedbackItem[]} items
 * @property {string} followUp
 * @property {string} modelAnswer
 * @property {{ agent: string, ms: number }[]} [pipeline]
 */

export {};
