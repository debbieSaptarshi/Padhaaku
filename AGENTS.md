# Padhaaku — Agent Notes

## Architecture (multi-agent)

Padhaaku is a **Next.js 15** app with three learning surfaces and one shared sidebar coach:

| Surface | Route | Owner | Description |
|---------|-------|-------|-------------|
| **Home** | `/` | Platform | Mode picker |
| **Ask** | `/ask` | Ask agent | Chat Q&A via `/api/chat` |
| **Explain** | `/explain` | Understanding Loop agent | Mind map / text + `/api/feedback` |
| **Practice** | `/practice` | Practice agent (WIP) | STEM hints + mastery |

**Haku** = persistent right sidebar (`src/components/haku/`). Coaches in Explain; idle helper text elsewhere.

### Integration rules

1. **Shared types** live in `src/lib/core/` — do not duplicate `TopicContext`, `Feedback`, or `StudyMode`.
2. **Cross-feature events** use `src/lib/core/events.ts` — emit/subscribe, no direct imports between feature folders.
3. **Pedagogy** is enforced server-side in `server/pedagogy-guard.mjs` for Explain/Practice (no model answer until round 3 or score ≥ 80).
4. **Shell** (`src/components/shell/AppShell.tsx`) owns nav + Haku slot. Features pass `haku` props only from Explain flow.
5. **Server modules** in `server/` are shared. Concept bank: `server/concepts.mjs`.

### File ownership

```
src/components/haku/       → Understanding Loop (Haku UI)
src/components/explain/      → Understanding Loop
src/components/ask/          → Ask agent
src/components/practice/     → Practice agent (future)
src/components/shell/        → Platform (coordinate PRs)
src/lib/core/                → Platform (coordinate PRs)
server/analyzer.mjs          → Understanding Loop
server/concepts.mjs          → Shared (PR review for new topics)
```

## Services

| Service | Start | URL |
|---------|-------|-----|
| Next.js | `npm run dev` | http://localhost:3000 |

## Commands

```bash
npm install
npm run lint
npm run build
```

## API smoke tests

```bash
# Ask
curl -s -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is photosynthesis?"}'

# Explain feedback
curl -s -X POST http://localhost:3000/api/feedback \
  -H 'Content-Type: application/json' \
  -d '{"topic":"photosynthesis","mode":"text","text":"Plants use sunlight and chlorophyll to make glucose from CO2 and water, releasing oxygen.","nodes":[],"roundNumber":1}'
```

## Optional OpenAI

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY`.
