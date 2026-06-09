# Padhaaku

Your study buddy that helps you understand any topic.

Padhaaku unifies **four specialized agents** behind one **Hybrid RAG** retrieval layer:

| Agent | App | API |
|-------|-----|-----|
| **Explainer** | `apps/web-chat` | `POST /api/chat` |
| **Socratic Feedback** | `apps/web-canvas` | `POST /api/feedback` |
| **Concept Analyzer** | fallback for feedback | automatic |
| **Practice Coach** | `apps/mobile` | `POST /api/v1/practice/*` |

## Monorepo layout

```
apps/
  api/           # Unified Express API + Hybrid RAG orchestrator
  web-chat/      # Next.js chat (Explainer)
  web-canvas/    # Vite learning canvas (Socratic assess)
  mobile/        # Expo practice coach
packages/
  core/          # Router, grader, orchestrator, shared types
  rag/           # Sparse + dense + graph fusion (RRF)
  knowledge/     # Unified concept + practice index
  llm/           # OpenAI / Anthropic adapters
  agents/        # Four product agents
data/seed/       # concepts.json + practice.json
```

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — enables LLM mode

# Terminal 1 — unified API (required)
npm run dev:api

# Terminal 2 — pick a surface
npm run dev:chat      # http://localhost:3000
npm run dev:canvas    # http://localhost:5173
npm run dev:mobile    # Expo dev server
```

## Verify the API

```bash
# Explainer (Hybrid RAG grounded)
curl -s -X POST http://localhost:8787/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is photosynthesis?"}'

# Socratic assess
curl -s -X POST http://localhost:8787/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"topic":"photosynthesis","text":"Plants use sunlight and CO2 to make sugar and release oxygen."}'

# Practice coach
curl -s -X POST http://localhost:8787/api/v1/practice/queue \
  -H 'Content-Type: application/json' \
  -d '{"mastery":{"stoichiometry":3.5}}'
```

## Branch consolidation

This `main` branch combines work from all parallel agent branches:

| Source branch | Features merged |
|---------------|-----------------|
| `cursor/hybrid-rag-monorepo-540d` | Unified monorepo, Hybrid RAG, four agents |
| `cursor/phase-4-questions-b390` | MC question panel, KaTeX, exam session |
| `cursor/core-loop-handwriting-f4b9` | Handwriting canvas, session persistence |
| `cursor/mindmap-understanding-loop-3a2c` | Revision banner, mastery screen, understanding loop |
| `cursor/haku-understanding-loop-0f3c` | Haku sidebar components (web-chat) |
| `cursor/learning-canvas-a3cd` | Mind map canvas foundation |
| `cursor/dev-environment-setup-f6ee` | AGENTS.md dev environment docs |
| `cursor/recreate-fermi-expo-app-b6db` | Expo mobile practice coach |

## Documentation

- [docs/HYBRID_RAG_PLAN.md](docs/HYBRID_RAG_PLAN.md) — architecture and phases
- [AGENTS.md](AGENTS.md) — agent orchestration map

## Environment

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Explainer + Socratic LLM |
| `ANTHROPIC_API_KEY` | Alternative LLM provider |
| `RAG_TOP_K` | Chunks after fusion (default 8) |
| `API_PORT` | Unified API port (default 8787) |
| `NEXT_PUBLIC_API_URL` | Web chat proxy target |
| `EXPO_PUBLIC_API_URL` | Mobile API target |
