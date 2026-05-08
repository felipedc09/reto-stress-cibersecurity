# 🔗 Guía de Consumo API - SECOP II Dashboard

## 📋 Endpoints Disponibles

```
GET /api/health                 → Health check del servicio
GET /api/rows                   → Obtener registros de datasets
GET /api/aggregate              → Obtener agregaciones pre-calculadas
```

---

## 1️⃣ Health Check

Verificar que el API está activo:

### cURL
```bash
curl https://api.tu-dominio.com/api/health
```

### Response
```json
{
  "ok": true,
  "service": "dataset-proxy",
  "now": "2026-05-08T14:30:45.123Z"
}
```

### JavaScript
```javascript
fetch('https://api.tu-dominio.com/api/health')
  .then(res => res.json())
  .then(data => console.log('Estado:', data))
  .catch(err => console.error('Error:', err));
```

### Python
```python
import requests

response = requests.get('https://api.tu-dominio.com/api/health')
print(response.json())
```

---

## 2️⃣ Obtener Registros (Socrata)

### Parámetros
```
domain      = www.datos.gov.co (dominio Socrata)
resourceId  = dmgg-8hin        (ID del dataset, formato: xxxx-xxxx)
limit       = 100              (max 5000, default 5000)
offset      = 0                (para paginación)
```

### cURL - Primeros 100 registros
```bash
curl "https://api.tu-dominio.com/api/rows?domain=www.datos.gov.co&resourceId=dmgg-8hin&limit=100&offset=0"
```

### cURL - Con paginación (registros 1000-1100)
```bash
curl "https://api.tu-dominio.com/api/rows?domain=www.datos.gov.co&resourceId=dmgg-8hin&limit=100&offset=1000"
```

### JavaScript - Obtener datos
```javascript
const domain = 'www.datos.gov.co';
const resourceId = 'dmgg-8hin';
const limit = 100;
const offset = 0;

const url = new URL('https://api.tu-dominio.com/api/rows');
url.searchParams.append('domain', domain);
url.searchParams.append('resourceId', resourceId);
url.searchParams.append('limit', limit);
url.searchParams.append('offset', offset);

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log(`Registros obtenidos: ${data.length}`);
    console.log(data);
  })
  .catch(err => console.error('Error:', err));
```

### JavaScript - Obtener todos (múltiples requests)
```javascript
async function fetchAllRecords(domain, resourceId) {
  const allRecords = [];
  const limit = 5000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = new URL('https://api.tu-dominio.com/api/rows');
    url.searchParams.set('domain', domain);
    url.searchParams.set('resourceId', resourceId);
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      hasMore = false;
    } else {
      allRecords.push(...data);
      offset += limit;
      console.log(`Obtenidos: ${allRecords.length} registros`);
    }

    // Rate limit: 1 request cada 500ms
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return allRecords;
}

// Uso
const records = await fetchAllRecords('www.datos.gov.co', 'dmgg-8hin');
console.log(`Total: ${records.length} registros`);
```

### Python - Obtener datos
```python
import requests

domain = 'www.datos.gov.co'
resource_id = 'dmgg-8hin'
limit = 100
offset = 0

url = 'https://api.tu-dominio.com/api/rows'
params = {
    'domain': domain,
    'resourceId': resource_id,
    'limit': limit,
    'offset': offset
}

response = requests.get(url, params=params)
data = response.json()

print(f"Registros obtenidos: {len(data)}")
print(data[:5])  # Primeros 5
```

### Python - Obtener todos
```python
import requests
import time

def fetch_all_records(domain, resource_id):
    all_records = []
    limit = 5000
    offset = 0
    has_more = True

    while has_more:
        url = 'https://api.tu-dominio.com/api/rows'
        params = {
            'domain': domain,
            'resourceId': resource_id,
            'limit': limit,
            'offset': offset
        }

        response = requests.get(url, params=params)
        data = response.json()

        if not data:
            has_more = False
        else:
            all_records.extend(data)
            offset += limit
            print(f"Obtenidos: {len(all_records)} registros")

        # Rate limit
        time.sleep(0.5)

    return all_records

# Uso
records = fetch_all_records('www.datos.gov.co', 'dmgg-8hin')
print(f"Total: {len(records)} registros")
```

---

## 3️⃣ Obtener Agregaciones (Local Data)

Para el dataset SECOP II local (`secop-contratos-local`):

### Parámetros
```
datasetId = secop-contratos-local (ID del dataset)
```

### cURL
```bash
curl "https://api.tu-dominio.com/api/aggregate?datasetId=secop-contratos-local"
```

### Response (Ejemplo)
```json
{
  "datasetId": "secop-contratos-local",
  "aggregations": {
    "by_departamento": [
      {
        "departamento": "Bogotá",
        "total_contratos": 280248,
        "valor_total": 7192818196456
      },
      {
        "departamento": "Valle del Cauca",
        "total_contratos": 109856,
        "valor_total": 4215627389123
      }
    ],
    "by_modalidad": [
      {
        "modalidad": "Contratación directa",
        "total_contratos": 759993,
        "porcentaje": 75.7
      }
    ]
  }
}
```

### JavaScript
```javascript
async function getAggregates() {
  const url = 'https://api.tu-dominio.com/api/aggregate?datasetId=secop-contratos-local';
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Departamentos:', data.aggregations.by_departamento);
    console.log('Modalidades:', data.aggregations.by_modalidad);
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

getAggregates();
```

### Python
```python
import requests

url = 'https://api.tu-dominio.com/api/aggregate?datasetId=secop-contratos-local'

response = requests.get(url)
data = response.json()

print("Departamentos:")
for dept in data['aggregations']['by_departamento']:
    print(f"  {dept['departamento']}: {dept['total_contratos']} contratos")

print("\nModalidades:")
for mod in data['aggregations']['by_modalidad']:
    print(f"  {mod['modalidad']}: {mod['porcentaje']}%")
```

---

## 🔑 Autenticación Opcional

Si el API requiere autenticación, usar header `X-App-Token`:

### cURL
```bash
curl -H "X-App-Token: tu-token-aqui" \
  "https://api.tu-dominio.com/api/rows?domain=www.datos.gov.co&resourceId=dmgg-8hin&limit=100"
```

### JavaScript
```javascript
const headers = {
  'X-App-Token': 'tu-token-aqui',
  'Content-Type': 'application/json'
};

fetch('https://api.tu-dominio.com/api/rows?...', { headers })
  .then(res => res.json())
  .then(data => console.log(data));
```

### Python
```python
import requests

headers = {
    'X-App-Token': 'tu-token-aqui'
}

response = requests.get(
    'https://api.tu-dominio.com/api/rows?...',
    headers=headers
)
```

---

## 📊 Ejemplo Completo: Dashboard en Vanilla JS

```html
<!DOCTYPE html>
<html>
<head>
  <title>SECOP II Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial; margin: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .chart { width: 50%; float: left; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Dashboard SECOP II</h1>
    <div class="chart">
      <canvas id="departamentosChart"></canvas>
    </div>
    <div class="chart">
      <canvas id="modalidadesChart"></canvas>
    </div>
  </div>

  <script>
    const API_BASE = 'https://api.tu-dominio.com';

    async function loadAggregates() {
      try {
        // Obtener agregaciones
        const aggResponse = await fetch(
          `${API_BASE}/api/aggregate?datasetId=secop-contratos-local`
        );
        const aggData = await aggResponse.json();

        // Gráfico 1: Departamentos
        const deptCtx = document.getElementById('departamentosChart').getContext('2d');
        new Chart(deptCtx, {
          type: 'bar',
          data: {
            labels: aggData.aggregations.by_departamento.map(d => d.departamento),
            datasets: [{
              label: 'Contratos por Departamento',
              data: aggData.aggregations.by_departamento.map(d => d.total_contratos),
              backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
          }
        });

        // Gráfico 2: Modalidades
        const modCtx = document.getElementById('modalidadesChart').getContext('2d');
        new Chart(modCtx, {
          type: 'doughnut',
          data: {
            labels: aggData.aggregations.by_modalidad.map(m => m.modalidad),
            datasets: [{
              data: aggData.aggregations.by_modalidad.map(m => m.porcentaje),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
          }
        });

      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    loadAggregates();
  </script>
</body>
</html>
```

---

## ⚡ Ejemplo Completo: Node.js/Express

```javascript
// server.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();

const API_BASE = 'https://api.tu-dominio.com';

// Endpoint: GET /data/secop
app.get('/data/secop', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const url = new URL(`${API_BASE}/api/rows`);
    url.searchParams.set('domain', 'www.datos.gov.co');
    url.searchParams.set('resourceId', 'dmgg-8hin');
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);

    const response = await fetch(url);
    const data = await response.json();

    res.json({
      count: data.length,
      limit,
      offset,
      data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: GET /data/aggregates
app.get('/data/aggregates', async (req, res) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/aggregate?datasetId=secop-contratos-local`
    );
    const data = await response.json();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Servidor en puerto 3000'));
```

Uso:
```bash
node server.js

# En otra terminal:
curl http://localhost:3000/data/secop?limit=50
curl http://localhost:3000/data/aggregates
```

---

## 🚀 Deployment del API

### Opción 1: Cloudflare Workers (Recomendado)

```bash
cd workers/api
wrangler deploy

# Tu API estará en: https://proyecto.tu-dominio.workers.dev
```

### Opción 2: Vercel

```bash
vercel deploy workers/api
```

### Opción 3: Heroku

```bash
heroku create mi-api-secop
git push heroku main
```

---

## 📊 Límites y Rate Limiting

| Parámetro | Límite |
|-----------|--------|
| Max records por request | 5,000 |
| Max offset | sin límite |
| Cache TTL | 60 segundos |
| Requests concurrentes | Sin límite en CF Workers |

---

## ✅ Checklist de Pruebas

- [ ] Health check funciona
- [ ] API `/rows` retorna datos
- [ ] API `/aggregate` retorna agregaciones
- [ ] CORS habilitado
- [ ] Paginación funciona
- [ ] Caching activo

