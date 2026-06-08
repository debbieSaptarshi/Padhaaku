# Padhaaku

**Your study buddy that helps you understand any topic.**

Padhaaku flips studying on its head. Instead of reading a wall of text, you pick a
topic and your study buddy asks: *"What do you think \<topic\> is?"* You explain it
in your own words — either by **sketching a mind map / diagram on a canvas** (mouse
or stylus) or by **typing** — and Padhaaku reviews it: it celebrates what you got
right, **highlights the exact spots that are wrong**, points out what's missing, and
**nudges** you with a follow-up question to push your thinking. This is active recall:
the fastest way to actually *understand* something instead of just re-reading it.

![Padhaaku](docs/preview.png)

## Features

- **Two ways to explain — your choice.**
  - 🕸 **Mind map mode:** double-click the canvas to drop concept nodes, drag the
    handle on a node to connect ideas, and switch to the **Pen** tool to draw a
    diagram freehand (pressure-sensitive, so a stylus works great).
  - ✍️ **Type mode:** just write what you think it is.
- **Targeted feedback that highlights the wrong area.** Flagged nodes glow red on the
  canvas (✕), correct ones glow green (✓), and in type mode the exact misconceived
  phrases are highlighted inline.
- **Socratic nudges.** Every review ends with a "Think about this 🤔" follow-up
  question and gentle prompts for the pieces you're missing — never just the answer.
- **Understanding score** so you can iterate and watch it climb as you refine.
- **Built-in concept-aware analyzer** for several common topics (photosynthesis, the
  water cycle, gravity, the human heart) so it works out of the box with **no API
  key**. Add an LLM key to get rich feedback on *any* topic (see below).

## Quick start

```bash
npm install
npm run dev
```

- Web app: http://localhost:5173
- API server: http://localhost:8787

`npm run dev` runs the Vite frontend and the Express API together. The frontend
proxies `/api/*` to the API.

### Production

```bash
npm run build   # builds the frontend into dist/
npm start       # serves the API + built frontend on PORT (default 8787)
```

## Using a real LLM (optional)

Out of the box, Padhaaku uses a local concept-aware analyzer so everything is fully
functional. To get detailed AI feedback on **any** topic, set one of these
environment variables before starting the server:

```bash
export OPENAI_API_KEY=sk-...        # uses gpt-4o-mini (override with OPENAI_MODEL)
# or
export ANTHROPIC_API_KEY=sk-ant-... # uses claude-3-5-haiku (override with ANTHROPIC_MODEL)
```

The key stays server-side. If a request to the provider fails, Padhaaku
automatically falls back to the local analyzer.

## How it works

```
src/
  components/
    TopicScreen.tsx     # pick a topic
    Workspace.tsx       # orchestrates mode + feedback state
    MindMapCanvas.tsx   # nodes, edges, freehand pen/eraser layer
    TextEditor.tsx      # type mode + inline highlight overlay
    FeedbackPanel.tsx   # score ring, nudges, follow-up, model answer
  lib/                  # types + API client
server/
  index.mjs             # Express API (/api/feedback, /api/health)
  analyzer.mjs          # local concept-aware feedback engine
  concepts.mjs          # knowledge bank (concepts + misconceptions per topic)
  llm.mjs               # optional OpenAI / Anthropic provider
```

The frontend sends your explanation (and mind-map nodes) to `/api/feedback`. The
server returns a structured review — a score, per-item feedback (`good` /
`incomplete` / `missing` / `misconception`), the node id or text span each item refers
to (so the UI can highlight it), a follow-up question, and a model answer.
