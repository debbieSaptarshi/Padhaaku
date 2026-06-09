# Padhaaku

**Your study buddy that helps you understand any topic.**

Padhaaku flips studying on its head. Instead of reading a wall of text or getting instant AI answers, you pick a topic and your study buddy asks: *"What do you think \<topic\> is?"* You explain it — by **handwriting on ruled paper** (stylus or mouse), **sketching a mind map**, or **typing** — and Padhaaku reviews it: celebrates what you got right, **highlights what's wrong**, points out what's missing, and **nudges** you with a Socratic follow-up. Model answers stay locked until you've genuinely tried.

## Features

### Core learner loop
- **Explain → Check → Nudge → Retry** with understanding score and **score delta** between attempts
- **Session persistence** — your draft and attempt history survive a browser refresh
- **Mastery celebration** at score ≥ 75
- **Anti-answer policy** — model answer locked until attempt 2, score ≥ 60, or 3 minutes of struggle

### Three input modes
- **✍️ Write (handwriting-first)** — ruled canvas, pressure-sensitive pen, eraser, undo; caption field for key ideas; optional vision AI reads your ink
- **🕸 Mind map** — concept nodes, connections, freehand pen overlay
- **⌨️ Type** — prose with inline misconception highlighting

### Feedback
- Structured items: on track, missing, incomplete, misconception
- Spatial highlights on mind-map nodes
- Works offline for **8 curated topics** (no API key)
- Any topic with OpenAI or Anthropic API key (+ handwriting vision)

## Quick start

```bash
npm install
npm run dev
```

- Web app: http://localhost:5173
- API server: http://localhost:8787

### Production

```bash
npm run build
npm start
```

### Optional LLM + handwriting vision

```bash
export OPENAI_API_KEY=sk-...
# or
export ANTHROPIC_API_KEY=sk-ant-...
```

With a key set, Padhaaku sends handwriting snapshots to the vision-capable model for richer feedback on ink you drew.

## Curated topics (offline)

Photosynthesis, The Water Cycle, Gravity, The Human Heart, Newton's Laws, Democracy, Fractions, Climate Change

## Architecture

```
src/
  components/
    HandwritingCanvas.tsx   # ruled paper + stylus pen
    MindMapCanvas.tsx
    Workspace.tsx           # session loop + mode orchestration
    FeedbackPanel.tsx       # score delta, model-answer gate
  lib/
    session.ts              # localStorage persistence
    canvasExport.ts         # handwriting → JPEG for vision API
server/
  analyzer.mjs              # local concept engine
  handwriting.mjs           # stroke metrics + nudges
  validate.mjs              # anti-answer policy + response shaping
  llm.mjs                   # OpenAI/Anthropic + vision
```
