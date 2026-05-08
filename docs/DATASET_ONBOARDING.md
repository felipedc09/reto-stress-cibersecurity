# Dataset Onboarding Checklist

Use this checklist whenever adding a new dataset (Socrata or local format).

## 1. Registry

- Add dataset entry in `config/datasets.json`.
- Confirm fields:
  - `id`
  - `name`
  - `provider`
  - `domain`
  - `resourceId`
  - `enabled`
- Add `schemaHints` (`dateFields`, `numericFields`).
- Add `analytics` (`dimensions`, `metrics`).

## 2. Pipeline compatibility

- Run local build for that dataset only:

```bash
python scripts/pipeline/build_aggregates.py --dataset <dataset-id>
```

- Confirm output files exist:
  - `data/raw/<dataset-id>.parquet`
  - `data/aggregates/<dataset-id>-agg.parquet`
  - `data/aggregates/<dataset-id>-agg.json`

## 3. Frontend support

- If the dataset is business-critical, add a dedicated profile in `dashboard-app.js`.
- Otherwise rely on the generic inferred profile.
- Validate filters, table columns, and null-analysis render correctly.

## 4. API support

- Confirm the domain is allowed by `ALLOWED_SOCRATA_DOMAINS` in worker config.
- Test endpoint:

```bash
curl "https://<worker-domain>/api/rows?domain=<domain>&resourceId=<dataset-id>&limit=10&offset=0"
```

## 5. CI and deployment

- Trigger `data-pipeline` workflow manually with `dataset=<dataset-id>`.
- Confirm artifacts are uploaded successfully.
- If using aggregate endpoint, verify `AGGREGATES_BASE_URL` contains `<dataset-id>-agg.json`.
- Trigger `deploy-pages` workflow to publish frontend and current aggregates.

## 6. Smoke test exit criteria

- Dashboard loads dataset without JS errors.
- At least one filter, one chart, and table pagination works.
- Null analysis section renders with ranking.
- Row count in status badge is non-zero.
