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

Build (also regenerates model JSON from `reference/`):

```bash
cd site_2
npm run build
```

Pushes to `main` deploy automatically via GitHub Actions.
