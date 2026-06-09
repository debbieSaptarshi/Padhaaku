# Padhaaku — Agent Orchestration

Four agents unified under **Hybrid RAG**. Implementation lives in `packages/` and is served by `apps/web`.

## Agents

| Agent | Package | Branch origin | Route |
|-------|---------|---------------|-------|
| Explainer | `packages/agents/src/explainer.ts` | `cursor/dev-environment-setup-f6ee` | `POST /api/chat` |
| Socratic Feedback | `packages/agents/src/socratic.ts` | `cursor/learning-canvas-a3cd` | `POST /api/feedback` |
| Concept Analyzer | `packages/agents/src/analyzer.ts` | `cursor/learning-canvas-a3cd` | fallback |
| Practice Coach | `packages/agents/src/coach.ts` | `cursor/recreate-fermi-expo-app-b6db` | `POST /api/practice/*` |

## Orchestration

```
Request → routeIntent() → createHybridRetriever().retrieve() → agent.run() → fallback if needed
```

Entry: `apps/web/src/lib/padhaaku.ts` → `getOrchestrator()`

## Run

```bash
npm install
npm run dev          # web on :3000
npm run mobile       # Expo (set EXPO_PUBLIC_API_URL)
```

## Status

- [x] Monorepo merge from parallel agent branches
- [x] Unified knowledge store (`data/seed/`)
- [x] Sparse + graph Hybrid RAG with RRF fusion
- [x] All four agents wired to API
- [x] Learn canvas in `/learn`
- [x] Practice web + mobile API client
- [ ] Dense vector index (Pinecone / local embeddings)
