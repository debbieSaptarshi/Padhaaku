# Padhaaku — Agent Notes

## Project overview

Padhaaku is a Next.js 15 study-buddy web app. Users ask questions in a chat UI; the backend returns structured explanations via `/api/chat`.

## Cursor Cloud specific instructions

### Services

| Service | Required | Start command | URL |
|---------|----------|---------------|-----|
| Next.js dev server | Yes | `npm run dev` | http://localhost:3000 |

No database, Redis, or Docker services are required.

### Dependency refresh

The VM update script runs `npm install` when `package.json` is present.

### Lint / test / build

```bash
npm run lint
npm run build
```

There is no dedicated test suite yet. Verify the chat API after changes:

```bash
curl -s -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"What is photosynthesis?"}'
```

### Optional OpenAI mode

Copy `.env.example` to `.env.local` and set `OPENAI_API_KEY` for AI-generated answers. Offline mode works without secrets.

### Gotchas

- The dev server must be running before hitting `localhost:3000` or the chat API.
- `next dev` hot reload picks up most source changes; restart after adding new env vars in `.env.local`.
