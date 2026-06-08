# Padhaaku

Your study buddy that helps you understand any topic.

Padhaaku is a Next.js web app with a chat interface. Ask about any subject and get a structured explanation with definitions, key ideas, examples, and practice prompts.

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
npm install
cp .env.example .env.local   # optional — enables OpenAI mode
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production server |
| `npm run lint` | Run ESLint |

## Modes

- **Offline (default):** Works without API keys. Padhaaku returns structured study guides based on your question.
- **OpenAI:** Set `OPENAI_API_KEY` in `.env.local` for richer AI-generated explanations.

## API

`POST /api/chat`

```json
{
  "message": "What is photosynthesis?",
  "history": []
}
```

Response:

```json
{
  "reply": "...",
  "mode": "offline"
}
```
