# Posteriograph API proxy

Server-side proxy for OpenAI Q&A and deterministic Bayesian-network queries. **Never put `OPENAI_API_KEY` in `site_2` or any `VITE_*` variable.**

## Setup

```bash
cd api
cp .env.example .env
# Edit .env and set OPENAI_API_KEY from your OpenAI developer account
npm install
npm run dev
```

Default listen address: `http://127.0.0.1:8787`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| POST | `/bn-query` | Deterministic BN query (JSON body, see `site_2/src/lib/bnQuery.ts`) |
| POST | `/ask` | Natural-language Q&A with optional tool calls to `/bn-query` logic |

## Frontend

```bash
cd site_2
# optional for production proxy URL:
# export VITE_API_BASE_URL=https://your-proxy.example.com
npm run dev
```

Dev uses `http://127.0.0.1:8787` when `VITE_API_BASE_URL` is unset.

## Security

- `OPENAI_API_KEY` only in `api/.env` (gitignored)
- CORS allowlist via `ALLOWED_ORIGINS`
- Per-IP rate limiting (`RATE_LIMIT_PER_MINUTE`)
- Max body and question length limits
- No chat logging by default
- PHI pattern redaction in questions (MRN/SSN-like patterns)

Deploy this service to any Node host (Railway, Fly.io, Cloud Run, a VPS, etc.) and set `VITE_API_BASE_URL` in the GitHub Pages build environment to that HTTPS origin.

## Google Cloud Run (automated)

1. Paste your OpenAI key into `api/.openai-key.secret` (one line, `sk-...`). This file is gitignored.
2. From repo root:

```bash
chmod +x api/deploy-gcloud.sh
./api/deploy-gcloud.sh
```

Uses project `tactical-grid-454202-h6` by default (`GCP_PROJECT_ID` to override). After deploy, set GitHub secret `VITE_API_BASE_URL` to the printed service URL and re-run **Deploy GitHub Pages**.
