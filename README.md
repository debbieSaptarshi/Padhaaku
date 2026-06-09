# Padhaaku

**Your study buddy that helps you understand any topic.**

Padhaaku flips studying on its head. Pick a topic, explain it on a **mind map** (or type it out), and your study buddy reviews what you got right, flags misconceptions, highlights missing pieces, and nudges you with Socratic follow-ups — never dumping the answer on the first try.

## Mind Map Understanding Loop

The core product flow:

1. **Pick a topic** — 20 bundled subjects across science, physics, and humanities, or any custom topic with an LLM key.
2. **Explain on canvas** — drop concept nodes, connect ideas, sketch with pen/stylus.
3. **Check understanding** — spatial feedback (✓/✕ on nodes), score, and one probing question.
4. **Revise** — ghost suggestions, quick-add buttons, score delta tracking.
5. **Reach mastery** — score ≥ 80 with no open misconceptions.

Sessions autosave to `localStorage` so you can refresh and continue.

## Features

- **Mind map mode:** nodes, edges, pressure-sensitive pen, undo/redo (Ctrl+Z)
- **Type mode:** inline phrase highlighting for misconceptions
- **20 bundled topics** with concept-aware local analyzer (no API key needed)
- **Edge validation** for topics like photosynthesis and food chains
- **Answer withholding** on first check; unlock on second attempt or "I'm stuck"
- **Mastery screen** with export to JSON
- **Optional LLM** — set `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` for any topic

## Quick start

```bash
npm install
npm run dev
```

- Web app: http://localhost:5173
- API server: http://localhost:8787

## Scripts

```bash
npm run typecheck   # TypeScript check
npm test            # Analyzer unit tests
npm run build       # Production build
npm start           # Serve built app + API
```

## Environment (optional)

```bash
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key, the built-in analyzer covers all 20 bundled topics.

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/topics` | Topic packs for the picker |
| `POST /api/feedback` | Review an explanation |
| `GET /api/health` | Health + LLM status |
