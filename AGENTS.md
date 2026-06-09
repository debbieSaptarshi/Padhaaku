# Padhaaku — Agent Orchestration

Padhaaku runs **four specialized agents** behind one **Hybrid RAG** retrieval layer.

## The four agents

| Agent | Source branch | Entry point | Hybrid RAG use |
|-------|---------------|-------------|----------------|
| **Explainer** | `cursor/dev-environment-setup-f6ee` | `POST /api/chat` | Ground explanations in `model_answer` + `concept` chunks |
| **Socratic Feedback** | `cursor/learning-canvas-a3cd` | `POST /api/feedback` | Assess against retrieved misconceptions + concepts |
| **Concept Analyzer** | `cursor/learning-canvas-a3cd` | fallback in `/api/feedback` | Sparse keyword match on unified knowledge store |
| **Practice Coach** | `cursor/recreate-fermi-expo-app-b6db` | `POST /api/v1/practice/*` | Mastery-aware question + hint retrieval |

## Orchestration flow

```
User input → Router → Hybrid RAG (sparse + dense + graph → RRF) → Grader → Agent → Response + citations
```

Packages:

- `packages/core` — router, grader, orchestrator, types
- `packages/rag` — sparse, dense proxy, fusion, hybrid retriever
- `packages/knowledge` — unified seed index from all parallel branches
- `packages/agents` — four product agents
- `apps/api` — single HTTP entry for all surfaces

## Running

```bash
npm install
npm run dev:api     # http://localhost:8787 (start this first)
npm run dev:chat    # http://localhost:3000
npm run dev:canvas  # http://localhost:5173
npm run dev:mobile  # Expo
```

## Smoke tests

```bash
curl -s -X POST http://localhost:8787/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is photosynthesis?"}'

curl -s -X POST http://localhost:8787/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"topic":"photosynthesis","text":"Plants use chlorophyll to capture light."}'
```

## Implementation status

| Phase | Status |
|-------|--------|
| 0 — Monorepo merge from 3 branches | Done |
| 1 — Seed data + hybrid sparse/dense retrieval | Done |
| 2 — Real vector index (pgvector/Pinecone) | Planned |
| 3 — Graph expansion + richer Socratic grounding | Planned |
| 4 — Mobile fully wired to practice API | Partial (`lib/api.ts` ready) |
| 5 — Observability (Langfuse traces) | Planned |
