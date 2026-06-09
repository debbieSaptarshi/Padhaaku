# Hybrid RAG — 4-Agent Orchestration

Padhaaku's feedback API runs a four-agent pipeline before falling back to legacy LLM or the local analyzer.

## Agents

| Order | Agent | Module | Role |
|------:|-------|--------|------|
| 1 | Router | `server/agents/router.mjs` | Topic resolution + retrieval query shaping |
| 2 | Retriever | `server/agents/retriever.mjs` | Hybrid sparse (BM25) + dense (embeddings) with RRF fusion |
| 3 | Assessor | `server/agents/assessor.mjs` | Grade explanation vs retrieved chunks |
| 4 | Coach | `server/agents/coach.mjs` | Socratic summary, follow-up, progressive model answer |

The registry in `server/agent-registry.mjs` is the single source of truth for agent order and wiring.

## API surfaces (parallel prototypes)

| Surface | Endpoint | Adapter |
|---------|----------|---------|
| Learning canvas (this branch) | `POST /api/feedback` | `server/shared/feedback-contract.mjs` |
| Next.js chat prototype | `POST /api/chat` | `server/adapters/chat-route.mjs` |
| Expo / mobile (future) | `POST /api/feedback` or `/api/chat` | same shared contract |

Set `PADHAAKU_API_URL=http://localhost:8787` in other prototypes to call this server.

## Commands

```bash
npm run ingest    # build sparse index + optional dense vectors
npm run server    # start API with Hybrid RAG enabled
```

Disable the pipeline: `PADHAAKU_DISABLE_HYBRID_RAG=1 npm run server`

## Environment

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Coach LLM + dense embeddings |
| `OPENAI_EMBEDDING_MODEL` | Default `text-embedding-3-small` |
| `PADHAAKU_DISABLE_HYBRID_RAG` | Set to `1` to skip orchestrator |
