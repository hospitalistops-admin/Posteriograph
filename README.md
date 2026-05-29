# Posteriograph

Cyberpunk evidence dashboard for the Ramsay pediatric UTI Bayesian network (b10 output).

## Live site

https://hospitalistops-admin.github.io/Posteriograph/

## Source materials

Model files, dictionaries, and supporting documentation live in [`reference/`](reference/). Start with [`reference/MODEL_FILES.md`](reference/MODEL_FILES.md).

## Development

```bash
cd site_2
npm ci
npm run dev
```

### Model assistant (optional)

The OpenAI API key lives only in the separate API proxy — never in the static site.

```bash
cd api
cp .env.example .env   # add OPENAI_API_KEY
npm ci
npm run dev            # http://127.0.0.1:8787
```

In another terminal, run `site_2` as above. Use **How this works** and **Model assistant** from the landing page.

For production on Google Cloud Run:

1. Paste your OpenAI key into `api/.openai-key.secret` (gitignored).
2. Run `./api/deploy-gcloud.sh` from the repo root.
3. Add GitHub Actions secret `VITE_API_BASE_URL` = the printed Cloud Run URL, then re-run **Deploy GitHub Pages**.

See [`api/README.md`](api/README.md) for details.

Build (also regenerates model JSON from `reference/`):

```bash
cd site_2
npm run build
```

Pushes to `main` deploy automatically via GitHub Actions.

## One-time setup (required before the site goes live)

1. **Enable GitHub Pages** — open [Settings → Pages](https://github.com/hospitalistops-admin/Posteriograph/settings/pages), set **Source** to **GitHub Actions**, then re-run the latest workflow from [Actions](https://github.com/hospitalistops-admin/Posteriograph/actions) (or push any commit to `main`).
2. **Connect Cursor to GitHub** — at [cursor.com/integrations](https://cursor.com/integrations), install the Cursor GitHub App on the `hospitalistops-admin` org with access to this repo.
3. **Edit from the web** — open [cursor.com/agents](https://cursor.com/agents), select `hospitalistops-admin/Posteriograph`, and start an agent session.
