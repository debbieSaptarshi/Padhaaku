# Padhaaku

Your study buddy that helps you understand any topic.

## Monorepo layout

```
apps/
  web/       Next.js — Chat, Learn canvas, Practice (unified API)
  mobile/    Expo — Fermi-style STEM practice (calls web API)
packages/
  core/      Orchestrator, router, shared types
  knowledge/ Unified knowledge store (concepts + questions)
  rag/       Hybrid retrieval (sparse + graph + RRF fusion)
  agents/    Explainer, Socratic, Analyzer, Coach
data/seed/   concepts.json, questions.json
```

## Four agents, one Hybrid RAG layer

| Agent | Surface | API |
|-------|---------|-----|
| **Explainer** | `/` chat | `POST /api/chat` |
| **Socratic Feedback** | `/learn` canvas | `POST /api/feedback` |
| **Concept Analyzer** | fallback (offline) | same as feedback |
| **Practice Coach** | `/practice`, mobile | `POST /api/practice/*` |

All agents share retrieval via `PadhaakuOrchestrator` → sparse + graph fusion (dense when `PINECONE_API_KEY` is set).

## Quick start

```bash
npm install
npm run dev
```

- Web: http://localhost:3000
- Chat: http://localhost:3000
- Learn: http://localhost:3000/learn
- Practice: http://localhost:3000/practice
- Health: http://localhost:3000/api/health

### Optional LLM

```bash
cp apps/web/.env.example apps/web/.env.local
# Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY
```

### Mobile (requires web API running)

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000 npm run mobile
```

## Docs

- [docs/HYBRID_RAG_PLAN.md](docs/HYBRID_RAG_PLAN.md) — architecture and phases
- [AGENTS.md](AGENTS.md) — agent map

## Verify

```bash
curl -s http://localhost:3000/api/health | jq
curl -s -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is photosynthesis?"}'
```
