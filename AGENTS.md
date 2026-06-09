# Padhaaku — Agent Orchestration

Padhaaku runs **four specialized agents** behind one **Hybrid RAG** retrieval layer, surfaced through **Haku** in `apps/web`.

## The four agents

| Agent | Source branch | Entry point | Hybrid RAG use |
|-------|---------------|-------------|----------------|
| **Explainer** | `cursor/dev-environment-setup-f6ee` | `POST /api/chat` | Ground explanations in `model_answer` + `concept` chunks |
| **Socratic Feedback** | `cursor/learning-canvas-a3cd` | `POST /api/feedback` | Assess against retrieved misconceptions + concepts |
| **Concept Analyzer** | `cursor/learning-canvas-a3cd` | fallback in `/api/feedback` | Sparse keyword match on unified knowledge store |
| **Practice Coach** | `cursor/recreate-fermi-expo-app-b6db` | `POST /api/v1/practice/*` | Mastery-aware question + hint retrieval |

## Unified web shell (`apps/web`)

| Route | Agent(s) | UI |
|-------|----------|-----|
| `/ask` | Explainer | Chat with Hybrid RAG |
| `/explain` | Socratic + Analyzer | Mind map / text canvas + Haku sidebar |
| `/practice` | Practice Coach | Exam session with MC + KaTeX |

Legacy standalone surfaces remain available: `apps/web-chat`, `apps/web-canvas`, `apps/mobile`.

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
npm run dev:web     # http://localhost:3000 — unified Haku shell (recommended)
npm run dev:chat    # http://localhost:3000 — Explainer only
npm run dev:canvas  # http://localhost:5173 — Canvas + Practice
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
| 0 — Monorepo merge from parallel branches | Done |
| 1 — Seed data + hybrid sparse/dense retrieval | Done |
| 2 — Unified Haku web shell (Explain + Ask + Practice) | Done |
| 3 — Real vector index (pgvector/Pinecone) | Planned |
| 4 — Graph expansion + richer Socratic grounding | Planned |
| 5 — Mobile fully wired to practice API | Partial (`lib/api.ts` ready) |
| 6 — Observability (Langfuse traces) | Planned |
