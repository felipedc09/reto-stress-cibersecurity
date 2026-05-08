const DEFAULT_ALLOWED_DOMAINS = ["www.datos.gov.co"];

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=60",
      ...extraHeaders,
    },
  });
}

function corsHeaders(origin = "*") {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function sanitizeLimit(value, defaultValue = 5000) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
  return Math.min(parsed, 5000);
}

function sanitizeOffset(value) {
  const parsed = Number.parseInt(value || "0", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function sanitizeResourceId(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9]{4}-[a-z0-9]{4}$/.test(raw)) return null;
  return raw;
}

function normalizeDomain(value, allowedDomains) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return null;
  if (!allowedDomains.includes(raw)) return null;
  return raw;
}

function getAllowedDomains(env) {
  const fromEnv = String(env.ALLOWED_SOCRATA_DOMAINS || "")
    .split(",")
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ALLOWED_DOMAINS;
}

async function handleRows(url, env) {
  const allowedDomains = getAllowedDomains(env);
  const domain = normalizeDomain(url.searchParams.get("domain"), allowedDomains);
  const resourceId = sanitizeResourceId(url.searchParams.get("resourceId"));
  const limit = sanitizeLimit(url.searchParams.get("limit"));
  const offset = sanitizeOffset(url.searchParams.get("offset"));

  if (!domain) {
    return jsonResponse({ error: "Invalid or unauthorized domain" }, 400, corsHeaders());
  }
  if (!resourceId) {
    return jsonResponse({ error: "Invalid resourceId format" }, 400, corsHeaders());
  }

  const upstreamUrl = new URL(`https://${domain}/resource/${resourceId}.json`);
  upstreamUrl.searchParams.set("$limit", String(limit));
  upstreamUrl.searchParams.set("$offset", String(offset));
  upstreamUrl.searchParams.set("$order", ":id");

  const headers = {};
  if (env.SOCRATA_APP_TOKEN) {
    headers["X-App-Token"] = env.SOCRATA_APP_TOKEN;
  }

  const response = await fetch(upstreamUrl.toString(), {
    method: "GET",
    headers,
    cf: { cacheTtl: 60, cacheEverything: true },
  });

  if (!response.ok) {
    return jsonResponse(
      {
        error: "Upstream request failed",
        status: response.status,
        url: upstreamUrl.toString(),
      },
      502,
      corsHeaders()
    );
  }

  const data = await response.json();
  return jsonResponse(data, 200, corsHeaders());
}

async function handleAggregate(url, env) {
  const datasetId = sanitizeResourceId(url.searchParams.get("datasetId"));
  if (!datasetId) {
    return jsonResponse({ error: "Invalid datasetId format" }, 400, corsHeaders());
  }

  const baseUrl = String(env.AGGREGATES_BASE_URL || "").trim();
  if (!baseUrl) {
    return jsonResponse({ error: "AGGREGATES_BASE_URL is not configured" }, 500, corsHeaders());
  }

  const upstream = `${baseUrl.replace(/\/$/, "")}/${datasetId}-agg.json`;
  const response = await fetch(upstream, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!response.ok) {
    return jsonResponse(
      { error: "Aggregate artifact not found", status: response.status, datasetId },
      404,
      corsHeaders()
    );
  }

  const data = await response.json();
  return jsonResponse(data, 200, corsHeaders());
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === "/api/health") {
      return jsonResponse({ ok: true, service: "dataset-proxy", now: new Date().toISOString() }, 200, corsHeaders());
    }

    if (url.pathname === "/api/rows") {
      return handleRows(url, env);
    }

    if (url.pathname === "/api/aggregate") {
      return handleAggregate(url, env);
    }

    return jsonResponse(
      {
        error: "Not found",
        routes: [
          "GET /api/health",
          "GET /api/rows?domain=www.datos.gov.co&resourceId=jbjy-vk9h&limit=5000&offset=0",
          "GET /api/aggregate?datasetId=jbjy-vk9h",
        ],
      },
      404,
      corsHeaders()
    );
  },
};
