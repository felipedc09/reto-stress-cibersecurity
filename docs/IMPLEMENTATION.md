# Multi-Dataset Dashboard Implementation

## Current Status

This repository now has the first implementation step for a scalable architecture:

- Frontend baseline: `dashboard.html`
- Frontend multi-dataset runtime: `dashboard-app.js`
- Dataset registry: `config/datasets.json`
- Aggregation pipeline: `scripts/pipeline/build_aggregates.py`
- Pipeline smoke tests: `scripts/pipeline/smoke_test.py`
- CI workflow (daily/manual): `.github/workflows/data-pipeline.yml`
- Serverless API scaffold: `workers/api/`
- Archived temporary artifacts: `archive/`

## Directory Layout

- `dashboard.html`: current UI implementation.
- `dashboard-app.js`: runtime for registered datasets, custom Socrata references, and local CSV/JSON uploads.
- `config/datasets.json`: dataset registry and analytics configuration.
- `scripts/pipeline/build_aggregates.py`: nightly/batch artifact builder.
- `scripts/pipeline/smoke_test.py`: non-heavy structural validation for pipeline + runtime wiring.
- `.github/workflows/data-pipeline.yml`: scheduled/manual data build in GitHub Actions.
- `workers/api/`: Cloudflare Worker for `/api/rows` proxy and `/api/aggregate` serving.
- `data/`: generated outputs (raw and aggregated parquet/json).
- `archive/`: previous one-off analysis scripts and files.

## Frontend Support Implemented

- Built-in datasets from `config/datasets.json`.
- Custom Socrata dataset by typing a resource id like `jbjy-vk9h` or pasting a dataset URL.
- Local file upload for `.csv`, `.tsv`, and `.json` tabular files.
- Known profiles for `jbjy-vk9h` and `dmgg-8hin`.
- Generic fallback profile for any other dataset with inferred filters, KPIs, charts, and table columns.

## Next Steps

1. Deploy the Cloudflare Worker and set `window.DATA_PROXY_BASE` in frontend deployment.
2. Publish aggregate JSONs to a static URL and set `AGGREGATES_BASE_URL` in worker env.
3. Add optional API-backed filtered aggregate endpoints (not only raw row proxy).
4. Add artifact retention and release promotion strategy (daily snapshots).

## Deployment Now Available

This repository now includes a Pages deployment workflow:

- `.github/workflows/deploy-pages.yml`
- `scripts/pipeline/prepare_pages_bundle.py`

### GitHub Pages

1. Enable GitHub Pages in repository settings using GitHub Actions as source.
2. Define repository variable `DATA_PROXY_BASE` with your Worker URL.
3. Run `deploy-pages` workflow (manual) or push to `main`.

The workflow generates `config/runtime.js` at build time and publishes the `dist/` bundle.

### Cloudflare Worker

1. Deploy from `workers/api/` using Wrangler.
2. Set Worker vars:
	- `AGGREGATES_BASE_URL`
	- `ALLOWED_SOCRATA_DOMAINS`
3. Set secret `SOCRATA_APP_TOKEN` (recommended).

### Data Pipeline

Use `.github/workflows/data-pipeline.yml` to refresh `data/aggregates/` daily/manual and keep the published dashboard artifacts updated.

## Local Run

From project root:

```bash
/home/felipedc09/felipe/hackaton/.venv/bin/python scripts/pipeline/build_aggregates.py
```

Process a single dataset:

```bash
/home/felipedc09/felipe/hackaton/.venv/bin/python scripts/pipeline/build_aggregates.py --dataset jbjy-vk9h
```
