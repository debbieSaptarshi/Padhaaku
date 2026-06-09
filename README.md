# Padhaaku

Your study buddy that helps you understand any topic.

Padhaaku unifies **four specialized agents** behind one **Hybrid RAG** retrieval layer, with **Haku** as your persistent sidebar coach across all learning modes.

| Agent | Mode | Surface |
|-------|------|---------|
| **Explainer** | Ask | `apps/web` → `/ask` |
| **Socratic Feedback** | Explain | `apps/web` → `/explain` |
| **Concept Analyzer** | Explain (fallback) | automatic when no LLM key |
| **Practice Coach** | Practice | `apps/web` → `/practice` + `apps/mobile` |

## Monorepo layout

```
apps/
  api/           # Unified Express API + Hybrid RAG orchestrator
  web/           # ★ Primary UI — Haku shell with Explain, Ask, Practice
  web-chat/      # Standalone Next.js chat (Explainer)
  web-canvas/    # Standalone Vite canvas (Socratic + Practice)
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

# Terminal 2 — unified web app (recommended)
npm run dev:web     # http://localhost:3000

# Or run individual surfaces
npm run dev:chat    # http://localhost:3000 (Explainer only)
npm run dev:canvas  # http://localhost:5173 (Canvas + Practice)
npm run dev:mobile  # Expo dev server
```

## Unified web app (`apps/web`)

One Next.js shell with **Haku** in the sidebar:

| Route | What it does |
|-------|--------------|
| `/` | Home — pick Explain, Ask, or Practice |
| `/explain` | Active recall: mind map or text → Haku checks understanding |
| `/ask` | Quick structured Q&A with Hybrid RAG grounding |
| `/practice` | STEM exam session with MC + open-ended, KaTeX math |

All routes proxy to the unified API at `http://localhost:8787`.

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
| `NEXT_PUBLIC_API_URL` | Web app proxy target |
| `EXPO_PUBLIC_API_URL` | Mobile API target |

## Combined from parallel agents

This monorepo merges work from all Cursor agent branches:

- `cursor/dev-environment-setup-f6ee` — Next.js Explainer chat
- `cursor/learning-canvas-a3cd` — Socratic canvas + concept analyzer
- `cursor/recreate-fermi-expo-app-b6db` — Expo Practice Coach
- `cursor/haku-understanding-loop-0f3c` — Haku sidebar + unified shell
- `cursor/mindmap-understanding-loop-3a2c` — Mind map understanding loop
- `cursor/core-loop-handwriting-f4b9` — Handwriting canvas strokes
- `cursor/phase-4-questions-b390` — Practice question panel + KaTeX exam
- `cursor/hybrid-rag-*` — Hybrid RAG orchestration + monorepo packages
