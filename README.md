# HookRelay

Reliable webhook delivery service: HMAC-signed payloads, idempotent ingestion, retries with exponential backoff and jitter, dead-letter queue and replay, and a transactional outbox so no event is ever lost.

**Stack:** TypeScript · Node.js · Express · PostgreSQL · Redis · BullMQ · Docker

> 🚧 Building in public, Oct–Nov 2026. Follow the commits.

## Getting started

**Requirements:** Node.js 22+, Docker

```bash
cp .env.example .env        # local config (gitignored)
docker compose up -d        # PostgreSQL 17 + Redis 7, with healthchecks
npm install
npm run dev                 # http://localhost:3000/health
```

| Script | What it does |
|---|---|
| `npm run dev` | run with hot reload (tsx) |
| `npm run build` / `npm start` | compile to `dist/` and run it |
| `npm run typecheck` | strict TypeScript check |
| `npm run lint` / `npm run format` | ESLint / Prettier |

## Progress
- [x] Day 1: TypeScript + Express skeleton, fail-fast config, JSON 404/500 handling, Docker Compose
- [ ] Day 2: PostgreSQL schema + migrations
