# Serverless API (Cloudflare Worker)

This Worker provides a lightweight data API for the dashboard:

- `GET /api/health`
- `GET /api/rows?domain=www.datos.gov.co&resourceId=jbjy-vk9h&limit=5000&offset=0`
- `GET /api/aggregate?datasetId=jbjy-vk9h`

## Why this exists

- Avoid direct browser calls for every heavy Socrata page request.
- Apply cache and optional Socrata app token server-side.
- Keep GitHub Pages frontend static while adding API capabilities.

## Setup

1. Install Wrangler:

```bash
npm install -g wrangler
```

2. Configure vars in `wrangler.toml`:
- `AGGREGATES_BASE_URL`
- `ALLOWED_SOCRATA_DOMAINS`

3. Configure secret token (optional but recommended):

```bash
wrangler secret put SOCRATA_APP_TOKEN
```

4. Deploy:

```bash
cd workers/api
wrangler deploy
```

## Frontend integration

Set a global variable before loading `dashboard-app.js`:

```html
<script>
  window.DATA_PROXY_BASE = "https://<your-worker-subdomain>.workers.dev";
</script>
```

When this variable is present, Socrata row fetches are routed via `/api/rows`.
