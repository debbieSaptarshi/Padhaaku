# Padhaaku

**Your study buddy that helps you understand any topic.**

Padhaaku combines three learning modes with **Haku** — a persistent sidebar coach:

| Mode | Route | What it does |
|------|-------|--------------|
| **Explain** | `/explain` | Active recall: mind map or text → Haku checks your understanding |
| **Ask** | `/ask` | Quick structured Q&A when you need an overview |
| **Practice** | `/practice` | STEM practice (in progress, parallel agent) |

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Architecture

- **Shell** — `AppShell` + `NavRail` + `HakuSidebar`
- **Shared contracts** — `src/lib/core/` (types, events, pedagogy)
- **Explain API** — `POST /api/feedback` (ported from learning-canvas)
- **Ask API** — `POST /api/chat`

See [AGENTS.md](./AGENTS.md) for multi-agent integration rules.

## Optional AI

```bash
cp .env.example .env.local
# set OPENAI_API_KEY=sk-...
```

Without a key, Explain uses a local concept analyzer (Photosynthesis, Water Cycle, Gravity, Human Heart).

## Scripts

```bash
npm run lint
npm run build
```
