# Padhaaku — Agent Orchestration

Padhaaku runs **four specialized agents** behind one **Hybrid RAG** retrieval layer. See [docs/HYBRID_RAG_PLAN.md](docs/HYBRID_RAG_PLAN.md) for the full implementation plan.

## The four agents

| Agent | Source branch | Entry point | Hybrid RAG use |
|-------|---------------|-------------|----------------|
| **Explainer** | `cursor/dev-environment-setup-f6ee` | `POST /api/chat` | Ground explanations in `model_answer` + `concept` chunks |
| **Socratic Feedback** | `cursor/learning-canvas-a3cd` | `POST /api/feedback` | Assess against retrieved misconceptions + concepts |
| **Concept Analyzer** | `cursor/learning-canvas-a3cd` | fallback in `/api/feedback` | Sparse keyword match on unified knowledge store |
| **Practice Coach** | `cursor/recreate-fermi-expo-app-b6db` | `POST /api/practice/*` | Mastery-aware question + hint retrieval |

## Orchestration flow

```
User input → Router (intent) → Hybrid RAG (sparse + dense + graph → RRF) → Agent → Response + citations
```

Scaffold packages:

- `packages/core` — types, router, orchestrator
- `packages/rag` — sparse search, fusion, hybrid retriever
- `packages/agents` — agent stubs wired to retrieval context

## Implementation status

| Phase | Status |
|-------|--------|
| 0 — Monorepo merge from 3 branches | Not started |
| 1 — Seed data + sparse retrieval | Scaffold ready |
| 2 — Dense vector index | Planned |
| 3 — Graph + Socratic grounding | Planned |
| 4 — Practice Coach API | Planned |
| 5 — Observability | Planned |

## Running (after monorepo merge)

```bash
npm install
npm run dev
```

## Environment

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Explainer + Socratic LLM |
| `PINECONE_API_KEY` | Dense retrieval (Phase 2) |
| `RAG_TOP_K` | Chunks after fusion (default 8) |
