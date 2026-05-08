const PAGE_SIZE = 5000;
const MAX_RECORDS = Infinity;
const TABLE_PAGE = 20;
const DATA_PROXY_BASE = (window.DATA_PROXY_BASE || '').trim();
const FILTER_IDS = ['f-departamento', 'f-sector', 'f-estado', 'f-tipo', 'f-destino', 'f-anio'];
const CHART_IDS = [
  'chart-depto',
  'chart-estado',
  'chart-modalidad',
  'chart-tipo',
  'chart-anio',
  'chart-sector-valor',
  'chart-destino',
  'chart-pyme',
];

const COLORS = [
  '#4f7cff', '#7c4fff', '#22c55e', '#f59e0b', '#ef4444',
  '#06b6d4', '#a855f7', '#f97316', '#10b981', '#e11d48',
  '#8b5cf6', '#0ea5e9', '#84cc16', '#fb923c', '#ec4899',
];

const FALLBACK_DATASET_REGISTRY = {
  defaultDataset: 'jbjy-vk9h',
  datasets: [
    {
      id: 'jbjy-vk9h',
      name: 'SECOP II - Contratos Publicos',
      provider: 'socrata',
      domain: 'www.datos.gov.co',
      resourceId: 'jbjy-vk9h',
      enabled: true,
    },
    {
      id: 'dmgg-8hin',
      name: 'SECOP II - Documentos Electronicos',
      provider: 'socrata',
      domain: 'www.datos.gov.co',
      resourceId: 'dmgg-8hin',
      enabled: true,
    },
  ],
};

let datasetRegistry = FALLBACK_DATASET_REGISTRY;
let currentDatasetSpec = null;
let currentProfile = null;
let allData = [];
let filteredData = [];
let tableData = [];
let currentPage = 1;
let sortKey = '';
let sortDir = 1;
let charts = {};
let inferredFieldStats = [];

const BUILTIN_PROFILES = {
  'jbjy-vk9h': {
    title: 'SECOP II - Contratos Publicos Colombia',
    subtitle: 'Datos abiertos · datos.gov.co · Dataset jbjy-vk9h',
    filters: [
      { label: 'Departamento', field: 'departamento', mode: 'value' },
      { label: 'Sector', field: 'sector', mode: 'value' },
      { label: 'Estado del Contrato', field: 'estado_contrato', mode: 'value' },
      { label: 'Tipo de Contrato', field: 'tipo_de_contrato', mode: 'value' },
      { label: 'Destino Gasto', field: 'destino_gasto', mode: 'value' },
      { label: 'Ano (firma)', field: 'fecha_de_firma', mode: 'year' },
    ],
    kpis: [
      {
        icon: '📋',
        label: 'Total Contratos',
        value: data => fmtNum(data.length),
        sub: () => 'registros filtrados',
      },
      {
        icon: '💰',
        label: 'Valor Total',
        value: data => fmtCurrency(sumField(data, 'valor_del_contrato')),
        sub: () => 'suma de valor_del_contrato',
      },
      {
        icon: '💳',
        label: 'Total Pagado',
        value: data => fmtCurrency(sumField(data, 'valor_pagado')),
        sub: data => percentageSub(sumField(data, 'valor_pagado'), sumField(data, 'valor_del_contrato')),
      },
      {
        icon: '⏳',
        label: 'Pendiente Ejecucion',
        value: data => fmtCurrency(sumField(data, 'valor_pendiente_de_ejecucion')),
        sub: () => 'por ejecutar',
      },
      {
        icon: '🏢',
        label: 'Entidades',
        value: data => fmtNum(uniqueCount(data, 'nit_entidad')),
        sub: () => 'entidades unicas',
      },
      {
        icon: '🤝',
        label: 'Proveedores',
        value: data => fmtNum(uniqueCount(data, 'documento_proveedor')),
        sub: () => 'proveedores unicos',
      },
      {
        icon: '📊',
        label: 'Valor Promedio',
        value: data => fmtCurrency(avgField(data, 'valor_del_contrato')),
        sub: () => 'por contrato',
      },
      {
        icon: '🕊️',
        label: 'Postconflicto',
        value: data => fmtNum(data.filter(row => normalizeText(row.espostconflicto) === 'si').length),
        sub: data => percentageSub(data.filter(row => normalizeText(row.espostconflicto) === 'si').length, data.length),
      },
    ],
    charts: [
      { title: '📍 Contratos por Departamento (Top 15)', kind: 'bar', field: 'departamento', limit: 15, horizontal: true, metricLabel: 'Contratos' },
      { title: '🏷️ Estado del Contrato', kind: 'doughnut', field: 'estado_contrato', limit: 20 },
      { title: '🏗️ Modalidad de Contratacion', kind: 'bar', field: 'modalidad_de_contratacion', limit: 10, horizontal: true, metricLabel: 'Contratos' },
      { title: '💼 Tipo de Contrato', kind: 'doughnut', field: 'tipo_de_contrato', limit: 12 },
      { title: '📅 Contratos por Ano de Firma', kind: 'line-year', field: 'fecha_de_firma', metricLabel: 'Contratos' },
      { title: '💵 Valor por Sector (Top 10)', kind: 'value-bar', field: 'sector', valueField: 'valor_del_contrato', aggregate: 'sum', limit: 10, metricLabel: 'Valor total' },
      { title: '🎯 Destino del Gasto', kind: 'doughnut', field: 'destino_gasto', limit: 10 },
      {
        title: '🏭 PYME vs Grupo vs Otro',
        build: data => ({
          kind: 'doughnut',
          labels: ['PYME', 'Grupo', 'Ninguno'],
          values: [
            data.filter(row => normalizeText(row.es_pyme) === 'si').length,
            data.filter(row => normalizeText(row.es_grupo) === 'si').length,
            data.filter(row => normalizeText(row.es_pyme) !== 'si' && normalizeText(row.es_grupo) !== 'si').length,
          ],
          metricLabel: 'Registros',
        }),
      },
    ],
    table: {
      title: '📋 Tabla de Contratos',
      searchPlaceholder: '🔍 Buscar entidad, proveedor, objeto…',
      searchFields: ['nombre_entidad', 'proveedor_adjudicado', 'objeto_del_contrato', 'departamento'],
      columns: [
        { label: 'Entidad', field: 'nombre_entidad', type: 'text', truncate: 40 },
        { label: 'Depto', field: 'departamento', type: 'text' },
        { label: 'Tipo', field: 'tipo_de_contrato', type: 'text', truncate: 24 },
        { label: 'Modalidad', field: 'modalidad_de_contratacion', type: 'text', truncate: 28 },
        { label: 'Estado', field: 'estado_contrato', type: 'badge' },
        { label: 'Proveedor', field: 'proveedor_adjudicado', type: 'text', truncate: 34 },
        { label: 'Valor (COP)', field: 'valor_del_contrato', type: 'currency', align: 'right' },
        { label: 'Fecha Firma', field: 'fecha_de_firma', type: 'date' },
        { label: 'Destino', field: 'destino_gasto', type: 'text', truncate: 18 },
      ],
    },
  },
  'dmgg-8hin': {
    title: 'SECOP II - Documentos Electronicos',
    subtitle: 'Datos abiertos · datos.gov.co · Dataset dmgg-8hin',
    filters: [
      { label: 'Proceso', field: 'proceso', mode: 'value' },
      { label: 'Entidad', field: 'entidad', mode: 'value' },
      { label: 'Extension', field: 'extensi_n', mode: 'value' },
      { label: 'NIT Entidad', field: 'nit_entidad', mode: 'value' },
      { label: 'Contrato', field: 'n_mero_de_contrato', mode: 'value' },
      { label: 'Ano de Carga', field: 'fecha_carga', mode: 'year' },
    ],
    kpis: [
      {
        icon: '📄',
        label: 'Total Documentos',
        value: data => fmtNum(data.length),
        sub: () => 'registros filtrados',
      },
      {
        icon: '💾',
        label: 'Tamano Promedio',
        value: data => fmtBytes(avgField(data, 'tamanno_archivo')),
        sub: () => 'tamanno_archivo promedio',
      },
      {
        icon: '📦',
        label: 'Tamano Maximo',
        value: data => fmtBytes(maxField(data, 'tamanno_archivo')),
        sub: () => 'archivo mas grande',
      },
      {
        icon: '🏢',
        label: 'Entidades',
        value: data => fmtNum(uniqueCount(data, 'nit_entidad')),
        sub: () => 'NIT distintos',
      },
      {
        icon: '🧭',
        label: 'Procesos',
        value: data => fmtNum(uniqueCount(data, 'proceso')),
        sub: () => 'procesos distintos',
      },
      {
        icon: '🧾',
        label: 'Extensiones',
        value: data => fmtNum(uniqueCount(data, 'extensi_n')),
        sub: () => 'tipos de archivo',
      },
      {
        icon: '🕒',
        label: 'Primera Carga',
        value: data => fmtDateOnly(minDateField(data, 'fecha_carga')),
        sub: () => 'fecha minima',
      },
      {
        icon: '🚀',
        label: 'Ultima Carga',
        value: data => fmtDateOnly(maxDateField(data, 'fecha_carga')),
        sub: () => 'fecha maxima',
      },
    ],
    charts: [
      { title: '🏢 Documentos por Entidad (Top 15)', kind: 'bar', field: 'entidad', limit: 15, horizontal: true, metricLabel: 'Documentos' },
      { title: '🧭 Documentos por Proceso', kind: 'doughnut', field: 'proceso', limit: 12 },
      { title: '🧾 Documentos por Extension', kind: 'bar', field: 'extensi_n', limit: 12, horizontal: true, metricLabel: 'Documentos' },
      { title: '📅 Documentos por Ano de Carga', kind: 'line-year', field: 'fecha_carga', metricLabel: 'Documentos' },
      { title: '💾 Tamano Promedio por Entidad (Top 10)', kind: 'value-bar', field: 'entidad', valueField: 'tamanno_archivo', aggregate: 'avg', limit: 10, metricLabel: 'Tamano promedio' },
      { title: '🏛️ Top NIT por Documentos', kind: 'bar', field: 'nit_entidad', limit: 10, horizontal: true, metricLabel: 'Documentos' },
      { title: '📁 Participacion por Entidad (Top 10)', kind: 'doughnut', field: 'entidad', limit: 10 },
      {
        title: '📝 Con Descripcion vs Sin Descripcion',
        build: data => ({
          kind: 'doughnut',
          labels: ['Con descripcion', 'Sin descripcion'],
          values: [
            data.filter(row => !isNullValue(row.descripci_n)).length,
            data.filter(row => isNullValue(row.descripci_n)).length,
          ],
          metricLabel: 'Documentos',
        }),
      },
    ],
    table: {
      title: '📋 Tabla de Documentos',
      searchPlaceholder: '🔍 Buscar proceso, entidad, archivo…',
      searchFields: ['proceso', 'entidad', 'nombre_archivo', 'n_mero_de_contrato'],
      columns: [
        { label: 'ID', field: 'id_documento', type: 'number', align: 'right' },
        { label: 'Proceso', field: 'proceso', type: 'text', truncate: 28 },
        { label: 'Entidad', field: 'entidad', type: 'text', truncate: 28 },
        { label: 'Archivo', field: 'nombre_archivo', type: 'text', truncate: 32 },
        { label: 'Extension', field: 'extensi_n', type: 'text' },
        { label: 'Tamano', field: 'tamanno_archivo', type: 'bytes', align: 'right' },
        { label: 'Fecha Carga', field: 'fecha_carga', type: 'date' },
        { label: 'NIT', field: 'nit_entidad', type: 'number', align: 'right' },
      ],
    },
  },
};

function fmtNum(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('es-CO');
}

function fmtCurrency(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return '—';
  if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + ' B';
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + ' MM';
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(1) + ' M';
  if (value >= 1e3) return '$' + (value / 1e3).toFixed(0) + ' K';
  return '$' + value.toLocaleString('es-CO');
}

function fmtBytes(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return '—';
  if (value >= 1024 ** 3) return (value / (1024 ** 3)).toFixed(2) + ' GB';
  if (value >= 1024 ** 2) return (value / (1024 ** 2)).toFixed(2) + ' MB';
  if (value >= 1024) return (value / 1024).toFixed(1) + ' KB';
  return fmtNum(value) + ' B';
}

function fmtDateOnly(value) {
  if (!value) return '—';
  const str = String(value);
  return str.length >= 10 ? str.slice(0, 10) : str;
}

function fmtPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return num.toFixed(1) + '%';
}

function parseVal(v) {
  if (v === null || v === undefined || v === '') return 0;
  const cleaned = String(v).replaceAll(',', '').replaceAll('$', '').trim();
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseYear(value) {
  if (!value) return 'N/D';
  const str = String(value).trim();
  return str.length >= 4 ? str.slice(0, 4) : 'N/D';
}

function colorScale(n) {
  return Array.from({ length: n }, (_, index) => COLORS[index % COLORS.length]);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function isNullValue(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase();
    return text === '' || text === 'no definido' || text === 'no aplica' || text === 'sin descripcion' || text === 'sin descripción' || text === 'n/a' || text === 'null' || text === 'ninguno';
  }
  return false;
}

function uniqueCount(data, field) {
  return new Set(data.map(row => row[field]).filter(value => !isNullValue(value))).size;
}

function sumField(data, field) {
  return data.reduce((sum, row) => sum + parseVal(row[field]), 0);
}

function avgField(data, field) {
  if (!data.length) return 0;
  const values = data.map(row => parseVal(row[field])).filter(value => Number.isFinite(value) && value !== 0);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxField(data, field) {
  const values = data.map(row => parseVal(row[field])).filter(value => Number.isFinite(value));
  return values.length ? Math.max(...values) : null;
}

function minField(data, field) {
  const values = data.map(row => parseVal(row[field])).filter(value => Number.isFinite(value) && value !== 0);
  return values.length ? Math.min(...values) : null;
}

function minDateField(data, field) {
  const values = data.map(row => row[field]).filter(value => !isNullValue(value)).sort();
  return values[0] || null;
}

function maxDateField(data, field) {
  const values = data.map(row => row[field]).filter(value => !isNullValue(value)).sort();
  return values.length ? values[values.length - 1] : null;
}

function percentageSub(numerator, denominator) {
  const safeDenominator = Number(denominator);
  if (!safeDenominator) return '0.0% del total';
  return fmtPercent((Number(numerator) / safeDenominator) * 100) + ' del total';
}

function badgeClass(value) {
  const text = normalizeText(value);
  if (!text) return 'badge-gray';
  if (text.includes('cerrado') || text.includes('ejecutado') || text.includes('liquidado')) return 'badge-green';
  if (text.includes('aprobado') || text.includes('activo') || text.includes('vigente')) return 'badge-blue';
  if (text.includes('cancelado') || text.includes('terminado') || text.includes('anulado')) return 'badge-red';
  if (text.includes('suspendido') || text.includes('pendiente')) return 'badge-yellow';
  return 'badge-gray';
}

function escapeHtml(value) {
  return String(value ?? '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function datasetApiBase(spec) {
  return `https://${spec.domain}/resource/${spec.resourceId}.json`;
}

function buildProxyRowsUrl(spec, limit, offset) {
  if (!DATA_PROXY_BASE) return null;
  const base = DATA_PROXY_BASE.endsWith('/') ? DATA_PROXY_BASE.slice(0, -1) : DATA_PROXY_BASE;
  const params = new URLSearchParams({
    domain: spec.domain,
    resourceId: spec.resourceId,
    limit: String(limit),
    offset: String(offset),
  });
  return `${base}/api/rows?${params.toString()}`;
}

async function loadDatasetRegistry() {
  try {
    const response = await fetch('config/datasets.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const config = await response.json();
    if (!config.datasets?.length) throw new Error('No dataset registry found');
    return config;
  } catch (error) {
    console.warn('Falling back to embedded dataset registry', error);
    return FALLBACK_DATASET_REGISTRY;
  }
}

function setupDatasetControls() {
  const select = document.getElementById('dataset-select');
  const datasets = datasetRegistry.datasets.filter(dataset => dataset.enabled !== false);
  select.innerHTML = '';
  datasets.forEach(dataset => {
    const option = document.createElement('option');
    option.value = dataset.id;
    option.textContent = `${dataset.name} (${dataset.resourceId})`;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    void loadRegisteredDataset(select.value);
  });

  document.getElementById('btn-load-reference').addEventListener('click', () => {
    void loadReferenceDataset();
  });

  document.getElementById('file-input').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    void loadLocalFile(file);
  });

  FILTER_IDS.forEach(id => {
    document.getElementById(id).addEventListener('change', applyFilters);
  });
}

async function initApp() {
  datasetRegistry = await loadDatasetRegistry();
  setupDatasetControls();
  const initialId = datasetRegistry.defaultDataset || datasetRegistry.datasets[0]?.id;
  if (initialId) {
    document.getElementById('dataset-select').value = initialId;
    await loadRegisteredDataset(initialId);
  }
}

async function loadRegisteredDataset(datasetId) {
  const dataset = datasetRegistry.datasets.find(item => item.id === datasetId);
  if (!dataset) {
    setStatus('error', `❌ Dataset no encontrado: ${datasetId}`);
    return;
  }

  document.getElementById('source-note').textContent = `Fuente registrada: ${dataset.name} (${dataset.resourceId})`;
  await loadSocrataDataset({ ...dataset, sourceType: 'registered' });
}

function parseSocrataReference(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return null;

  const idMatch = value.match(/[a-z0-9]{4}-[a-z0-9]{4}/i);
  const urlMatch = value.match(/^https?:\/\/([^/]+)\//i);
  const domain = urlMatch ? urlMatch[1] : null;
  const resourceId = idMatch ? idMatch[0].toLowerCase() : null;
  if (!resourceId) return null;
  return { resourceId, domain };
}

async function loadReferenceDataset() {
  const rawReference = document.getElementById('custom-dataset-ref').value;
  const fallbackDomain = document.getElementById('custom-dataset-domain').value.trim() || 'www.datos.gov.co';
  const parsed = parseSocrataReference(rawReference);

  if (!parsed) {
    setStatus('error', '❌ Referencia invalida. Usa un id tipo jbjy-vk9h o una URL completa.');
    return;
  }

  const registered = datasetRegistry.datasets.find(item => item.resourceId === parsed.resourceId || item.id === parsed.resourceId);
  if (registered) {
    document.getElementById('dataset-select').value = registered.id;
    await loadRegisteredDataset(registered.id);
    return;
  }

  const spec = {
    id: parsed.resourceId,
    name: `Dataset ${parsed.resourceId}`,
    provider: 'socrata',
    domain: parsed.domain || fallbackDomain,
    resourceId: parsed.resourceId,
    sourceType: 'reference',
  };

  document.getElementById('source-note').textContent = `Fuente por referencia: ${spec.domain} / ${spec.resourceId}`;
  await loadSocrataDataset(spec);
}

async function loadLocalFile(file) {
  setStatus('loading', `⏳ Leyendo archivo ${file.name}…`);
  try {
    const rows = await parseFile(file);
    if (!Array.isArray(rows) || !rows.length || typeof rows[0] !== 'object') {
      throw new Error('El archivo no contiene filas tabulares validas');
    }
    currentDatasetSpec = {
      id: `file-${Date.now()}`,
      name: file.name,
      sourceType: 'file',
      domain: 'local',
      resourceId: file.name,
    };
    allData = rows;
    finalizeDatasetLoad();
    document.getElementById('source-note').textContent = `Archivo local cargado: ${file.name}`;
  } catch (error) {
    console.error(error);
    setStatus('error', `❌ Error al leer archivo: ${error.message}`);
  }
}

function parseFile(file) {
  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.json')) {
    return file.text().then(content => {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : parsed.data || [];
    });
  }

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: results => resolve(results.data || []),
      error: error => reject(error),
    });
  });
}

async function loadSocrataDataset(spec) {
  currentDatasetSpec = spec;
  setStatus('loading', `⏳ Descargando ${spec.resourceId}…`);
  try {
    allData = await fetchAllSocrata(spec);
    finalizeDatasetLoad();
    document.getElementById('dataset-select').value = datasetRegistry.datasets.some(item => item.id === spec.id) ? spec.id : document.getElementById('dataset-select').value;
  } catch (error) {
    console.error(error);
    setStatus('error', `❌ Error: ${error.message}`);
  }
}

async function fetchAllSocrata(spec) {
  const apiBase = datasetApiBase(spec);
  const rows = [];
  let offset = 0;
  let total = 0;

  while (offset < MAX_RECORDS) {
    const proxyUrl = buildProxyRowsUrl(spec, PAGE_SIZE, offset);
    const url = proxyUrl || `${apiBase}?$limit=${PAGE_SIZE}&$offset=${offset}&$order=:id`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const batch = await response.json();
    if (!batch.length) break;
    rows.push(...batch);
    total += batch.length;
    setStatus('loading', `⏳ Descargando ${spec.resourceId}… ${fmtNum(total)} registros`);
    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return rows;
}

function finalizeDatasetLoad() {
  inferredFieldStats = inferFieldStats(allData);
  currentProfile = resolveProfile(currentDatasetSpec, allData, inferredFieldStats);
  sortKey = '';
  sortDir = 1;
  currentPage = 1;
  updateHeader();
  populateFilters();
  applyFilters();
  renderNullAnalysis();
  setStatus('done', `✅ ${fmtNum(allData.length)} registros cargados`);
}

function updateHeader() {
  const title = currentProfile?.title || currentDatasetSpec?.name || 'Dashboard Multi-Dataset';
  const subtitle = currentProfile?.subtitle || `Fuente activa · ${currentDatasetSpec?.resourceId || 'dataset personalizado'}`;
  document.getElementById('dashboard-title').textContent = title;
  document.getElementById('dashboard-subtitle').textContent = subtitle;
  document.title = `${title} · Dashboard`;
}

function inferFieldStats(data) {
  const fieldSet = new Set();
  data.slice(0, 300).forEach(row => {
    Object.keys(row || {}).forEach(key => fieldSet.add(key));
  });

  return [...fieldSet].map(field => {
    const sampleValues = data
      .map(row => row[field])
      .filter(value => !isNullValue(value))
      .slice(0, 120);

    const numericHits = sampleValues.filter(isLikelyNumericValue).length;
    const dateHits = sampleValues.filter(isLikelyDateValue).length;
    const distinctValues = new Set(sampleValues.map(value => String(value))).size;

    let type = 'text';
    if (sampleValues.length && numericHits / sampleValues.length >= 0.9) type = 'numeric';
    if (sampleValues.length && dateHits / sampleValues.length >= 0.8) type = 'date';

    return {
      field,
      type,
      distinctValues,
      sampleValues,
      nonNullCount: sampleValues.length,
    };
  });
}

function isLikelyNumericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return false;
  const cleaned = value.replaceAll(',', '').replaceAll('$', '').trim();
  if (!cleaned) return false;
  return Number.isFinite(Number(cleaned));
}

function isLikelyDateValue(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (!/^\d{4}[-/]/.test(trimmed) && !/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) return false;
  return !Number.isNaN(Date.parse(trimmed));
}

function resolveProfile(spec, data, fieldStats) {
  const key = spec?.resourceId || spec?.id;
  if (BUILTIN_PROFILES[key]) return BUILTIN_PROFILES[key];
  return buildGenericProfile(spec, data, fieldStats);
}

function buildGenericProfile(spec, data, fieldStats) {
  const textFields = fieldStats.filter(item => item.type === 'text').map(item => item.field);
  const numericFields = fieldStats.filter(item => item.type === 'numeric').map(item => item.field);
  const dateFields = fieldStats.filter(item => item.type === 'date').map(item => item.field);
  const primaryDate = dateFields[0];
  const primaryNumeric = numericFields[0];

  const filters = textFields
    .filter(field => field !== 'urlproceso')
    .slice(0, 5)
    .map(field => ({ label: humanizeField(field), field, mode: 'value' }));

  if (primaryDate) {
    filters.push({ label: `Ano (${humanizeField(primaryDate)})`, field: primaryDate, mode: 'year' });
  }

  const searchFields = textFields.slice(0, 4);
  const tableColumns = [...textFields.slice(0, 4), ...numericFields.slice(0, 2), ...dateFields.slice(0, 2)]
    .slice(0, 8)
    .map(field => ({
      label: humanizeField(field),
      field,
      type: dateFields.includes(field) ? 'date' : numericFields.includes(field) ? 'number' : 'text',
      align: numericFields.includes(field) ? 'right' : undefined,
      truncate: numericFields.includes(field) ? undefined : 28,
    }));

  return {
    title: spec?.name || 'Dataset personalizado',
    subtitle: spec?.sourceType === 'file'
      ? `Archivo local · ${spec.resourceId}`
      : `Dataset Socrata · ${spec?.domain || 'origen externo'} · ${spec?.resourceId || spec?.id}`,
    filters,
    kpis: [
      { icon: '📋', label: 'Total Registros', value: rows => fmtNum(rows.length), sub: () => 'filtrados' },
      { icon: '🧩', label: 'Variables', value: () => fmtNum(fieldStats.length), sub: () => 'columnas detectadas' },
      { icon: '🔢', label: 'Numericas', value: () => fmtNum(numericFields.length), sub: () => 'campos numericos' },
      { icon: '📅', label: 'Fechas', value: () => fmtNum(dateFields.length), sub: () => 'campos fecha' },
      { icon: '📝', label: 'Texto', value: () => fmtNum(textFields.length), sub: () => 'campos texto' },
      {
        icon: '📈',
        label: primaryNumeric ? `Max ${humanizeField(primaryNumeric)}` : 'Maximo',
        value: rows => primaryNumeric ? fmtGenericNumeric(maxField(rows, primaryNumeric)) : '—',
        sub: () => primaryNumeric ? 'maximo filtrado' : 'sin campo numerico',
      },
      {
        icon: '🕒',
        label: primaryDate ? `Ultima ${humanizeField(primaryDate)}` : 'Ultima fecha',
        value: rows => primaryDate ? fmtDateOnly(maxDateField(rows, primaryDate)) : '—',
        sub: () => primaryDate ? 'fecha maxima' : 'sin campo fecha',
      },
      {
        icon: '🧼',
        label: 'Completitud',
        value: rows => fmtPercent(averageCompleteness(rows, fieldStats)),
        sub: () => 'promedio por celda',
      },
    ],
    charts: [
      buildGenericCountChart('Top categoria 1', textFields[0], 15, true),
      buildGenericDoughnutChart('Top categoria 2', textFields[1], 12),
      buildGenericCountChart('Top categoria 3', textFields[2], 12, true),
      buildGenericDoughnutChart('Top categoria 4', textFields[3], 10),
      primaryDate ? { title: `Serie por ano de ${humanizeField(primaryDate)}`, kind: 'line-year', field: primaryDate, metricLabel: 'Registros' } : buildEmptyChart('Sin campo fecha disponible'),
      primaryNumeric && textFields[0] ? { title: `${humanizeField(primaryNumeric)} por ${humanizeField(textFields[0])}`, kind: 'value-bar', field: textFields[0], valueField: primaryNumeric, aggregate: 'sum', limit: 10, metricLabel: humanizeField(primaryNumeric) } : buildEmptyChart('Sin combinacion texto/numerico'),
      buildGenericDoughnutChart('Top categoria 5', textFields[4], 10),
      {
        title: 'Variables con mas nulos',
        build: rows => {
          const entries = fieldStats.map(item => ({
            label: humanizeField(item.field),
            value: rows.filter(row => isNullValue(row[item.field])).length,
          })).sort((left, right) => right.value - left.value).slice(0, 8);
          return {
            kind: 'doughnut',
            labels: entries.map(entry => entry.label),
            values: entries.map(entry => entry.value),
            metricLabel: 'Nulos',
          };
        },
      },
    ],
    table: {
      title: '📋 Tabla del Dataset',
      searchPlaceholder: '🔍 Buscar en columnas principales…',
      searchFields,
      columns: tableColumns,
    },
  };
}

function buildGenericCountChart(title, field, limit, horizontal) {
  return field
    ? { title: `${title}: ${humanizeField(field)}`, kind: 'bar', field, limit, horizontal, metricLabel: 'Registros' }
    : buildEmptyChart('Sin campo de categoria');
}

function buildGenericDoughnutChart(title, field, limit) {
  return field
    ? { title: `${title}: ${humanizeField(field)}`, kind: 'doughnut', field, limit }
    : buildEmptyChart('Sin campo de categoria');
}

function buildEmptyChart(title) {
  return {
    title,
    build: () => ({ kind: 'doughnut', labels: ['Sin datos'], values: [1], metricLabel: 'Sin datos' }),
  };
}

function humanizeField(field) {
  return String(field || 'campo').replaceAll('_', ' ').trim();
}

function averageCompleteness(rows, fieldStats) {
  if (!rows.length || !fieldStats.length) return 0;
  const totalCells = rows.length * fieldStats.length;
  let nonNullCells = 0;
  rows.forEach(row => {
    fieldStats.forEach(field => {
      if (!isNullValue(row[field.field])) nonNullCells += 1;
    });
  });
  return (nonNullCells / totalCells) * 100;
}

function fmtGenericNumeric(value) {
  if (!Number.isFinite(Number(value))) return '—';
  if (Math.abs(Number(value)) >= 1000) return fmtNum(value);
  return String(Number(value).toFixed(2));
}

function populateFilters() {
  const groups = [...document.querySelectorAll('.filters .filter-group')];
  const filters = currentProfile?.filters || [];

  groups.forEach((group, index) => {
    const config = filters[index];
    const label = group.querySelector('label');
    const select = group.querySelector('select');
    select.innerHTML = '<option value="">Todos</option>';

    if (!config) {
      group.classList.add('is-hidden');
      return;
    }

    group.classList.remove('is-hidden');
    label.textContent = config.label;

    const values = [...new Set(allData.map(row => config.mode === 'year' ? parseYear(row[config.field]) : row[config.field]).filter(value => !isNullValue(value) && value !== 'N/D'))].sort();
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  });
}

function applyFilters() {
  const filters = currentProfile?.filters || [];
  filteredData = allData.filter(row => {
    return filters.every((config, index) => {
      const selectValue = document.getElementById(FILTER_IDS[index]).value;
      if (!selectValue) return true;
      if (config.mode === 'year') return parseYear(row[config.field]) === selectValue;
      return String(row[config.field] ?? '') === selectValue;
    });
  });

  currentPage = 1;
  renderKPIs();
  renderCharts();
  renderTable();
}

function resetFilters() {
  FILTER_IDS.forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('table-search').value = '';
  applyFilters();
}

window.resetFilters = resetFilters;

function renderKPIs() {
  const labelNodes = [...document.querySelectorAll('.kpi-card .kpi-label')];
  const valueNodes = [...document.querySelectorAll('.kpi-card .kpi-value')];
  const subNodes = [...document.querySelectorAll('.kpi-card .kpi-sub')];
  const iconNodes = [...document.querySelectorAll('.kpi-card .kpi-icon')];
  const kpis = currentProfile?.kpis || [];

  labelNodes.forEach((labelNode, index) => {
    const kpi = kpis[index];
    if (!kpi) {
      labelNode.textContent = 'Sin uso';
      valueNodes[index].textContent = '—';
      subNodes[index].textContent = 'no configurado';
      iconNodes[index].textContent = '•';
      return;
    }
    labelNode.textContent = kpi.label;
    valueNodes[index].textContent = kpi.value(filteredData, { allData, inferredFieldStats });
    subNodes[index].textContent = kpi.sub(filteredData, { allData, inferredFieldStats });
    iconNodes[index].textContent = kpi.icon;
  });
}

function groupEntries(data, field, options = {}) {
  const { limit = 10, valueField = null, aggregate = 'count' } = options;
  const map = new Map();

  data.forEach(row => {
    const key = row[field] || 'N/D';
    const entry = map.get(key) || { count: 0, sum: 0 };
    entry.count += 1;
    entry.sum += valueField ? parseVal(row[valueField]) : 0;
    map.set(key, entry);
  });

  const rows = [...map.entries()].map(([key, entry]) => ({
    key,
    value: aggregate === 'sum' ? entry.sum : aggregate === 'avg' ? (entry.count ? entry.sum / entry.count : 0) : entry.count,
  }));

  rows.sort((left, right) => right.value - left.value);
  return rows.slice(0, limit);
}

function buildYearSeries(data, field) {
  const map = {};
  data.forEach(row => {
    const year = parseYear(row[field]);
    if (year && year !== 'N/D') map[year] = (map[year] || 0) + 1;
  });
  const labels = Object.keys(map).sort();
  return {
    labels,
    values: labels.map(label => map[label]),
  };
}

function destroyChart(id) {
  if (charts[id]) {
    charts[id].destroy();
    delete charts[id];
  }
}

function makeBarChart(id, labels, values, label, horizontal = false) {
  destroyChart(id);
  const ctx = document.getElementById(id).getContext('2d');
  charts[id] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label, data: values, backgroundColor: colorScale(values.length), borderRadius: 5, borderSkipped: false }],
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => ` ${fmtNum(context.parsed[horizontal ? 'x' : 'y'])}`,
          },
        },
      },
      scales: {
        x: { grid: { color: '#1e2133' }, ticks: { color: '#94a3b8', font: { size: 10 }, maxRotation: horizontal ? 0 : 35 } },
        y: { grid: { color: '#1e2133' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      },
    },
  });
}

function makeDoughnut(id, labels, values) {
  destroyChart(id);
  const ctx = document.getElementById(id).getContext('2d');
  charts[id] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colorScale(values.length), borderWidth: 2, borderColor: '#1a1d27', hoverOffset: 6 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { color: '#94a3b8', boxWidth: 12, padding: 10, font: { size: 10 } } },
        tooltip: { callbacks: { label: context => ` ${context.label}: ${fmtNum(context.parsed)}` } },
      },
    },
  });
}

function makeLineChart(id, labels, values, label) {
  destroyChart(id);
  const ctx = document.getElementById(id).getContext('2d');
  charts[id] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: '#4f7cff',
        backgroundColor: 'rgba(79,124,255,0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#4f7cff',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: context => ` ${fmtNum(context.parsed.y)}` } },
      },
      scales: {
        x: { grid: { color: '#1e2133' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
        y: { grid: { color: '#1e2133' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
      },
    },
  });
}

function makeValueBarChart(id, labels, values, label, horizontal = true, formatter = fmtGenericNumeric) {
  destroyChart(id);
  const ctx = document.getElementById(id).getContext('2d');
  charts[id] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label, data: values, backgroundColor: colorScale(values.length), borderRadius: 4, borderSkipped: false }],
    },
    options: {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: context => ` ${formatter(context.parsed[horizontal ? 'x' : 'y'])}` } },
      },
      scales: {
        x: { grid: { color: '#1e2133' }, ticks: { color: '#94a3b8', font: { size: 9 }, callback: value => formatter(value) } },
        y: { grid: { color: '#1e2133' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
      },
    },
  });
}

function renderCharts() {
  const titleNodes = [...document.querySelectorAll('.chart-card h3')];
  const cards = [...document.querySelectorAll('.chart-card')];
  const chartConfigs = currentProfile?.charts || [];

  CHART_IDS.forEach((chartId, index) => {
    const config = chartConfigs[index];
    const titleNode = titleNodes[index];
    const card = cards[index];
    if (!config) {
      destroyChart(chartId);
      titleNode.textContent = 'Sin grafico configurado';
      card.classList.add('is-hidden');
      return;
    }

    card.classList.remove('is-hidden');
    titleNode.textContent = config.title;
    const resolved = config.build ? config.build(filteredData) : resolveChartConfig(config, filteredData);
    drawResolvedChart(chartId, resolved);
  });
}

function resolveChartConfig(config, data) {
  if (config.kind === 'line-year') {
    const series = buildYearSeries(data, config.field);
    return { kind: 'line-year', labels: series.labels, values: series.values, metricLabel: config.metricLabel || 'Registros' };
  }

  const entries = groupEntries(data, config.field, {
    limit: config.limit || 10,
    valueField: config.valueField,
    aggregate: config.aggregate || 'count',
  });

  return {
    kind: config.kind,
    labels: entries.map(entry => entry.key),
    values: entries.map(entry => entry.value),
    metricLabel: config.metricLabel || 'Registros',
    horizontal: Boolean(config.horizontal),
    formatter: config.aggregate === 'sum' ? fmtCurrency : config.valueField === 'tamanno_archivo' ? fmtBytes : fmtGenericNumeric,
  };
}

function drawResolvedChart(chartId, resolved) {
  const labels = resolved.labels?.length ? resolved.labels : ['Sin datos'];
  const values = resolved.values?.length ? resolved.values : [0];

  if (resolved.kind === 'bar') {
    makeBarChart(chartId, labels, values, resolved.metricLabel, resolved.horizontal);
    return;
  }
  if (resolved.kind === 'value-bar') {
    makeValueBarChart(chartId, labels, values, resolved.metricLabel, true, resolved.formatter || fmtGenericNumeric);
    return;
  }
  if (resolved.kind === 'line-year') {
    makeLineChart(chartId, labels, values, resolved.metricLabel);
    return;
  }
  makeDoughnut(chartId, labels, values);
}

function renderTable() {
  renderTableHeader();
  tableData = [...filteredData];
  document.getElementById('table-search').value = '';
  document.getElementById('table-search').placeholder = currentProfile?.table?.searchPlaceholder || '🔍 Buscar…';
  document.getElementById('table-title').textContent = currentProfile?.table?.title || '📋 Tabla';
  renderTablePage();
}

function renderTableHeader() {
  const headerRow = document.getElementById('table-head-row');
  headerRow.innerHTML = '';
  const columns = currentProfile?.table?.columns || [];
  columns.forEach(column => {
    const th = document.createElement('th');
    th.textContent = column.label;
    if (column.align === 'right') th.style.textAlign = 'right';
    const icon = document.createElement('span');
    icon.className = 'sort-icon';
    icon.textContent = '⇅';
    th.appendChild(icon);
    th.addEventListener('click', () => sortTable(column.field));
    headerRow.appendChild(th);
  });
}

function filterTable() {
  const searchFields = currentProfile?.table?.searchFields || [];
  const query = normalizeText(document.getElementById('table-search').value);
  if (!query) {
    tableData = [...filteredData];
  } else {
    tableData = filteredData.filter(row => searchFields.some(field => normalizeText(row[field]).includes(query)));
  }
  currentPage = 1;
  renderTablePage();
}

window.filterTable = filterTable;

function sortTable(key) {
  if (sortKey === key) sortDir *= -1;
  else {
    sortKey = key;
    sortDir = 1;
  }

  tableData.sort((left, right) => compareValues(left[key], right[key]) * sortDir);
  renderTablePage();
}

window.sortTable = sortTable;

function compareValues(left, right) {
  if (isLikelyNumericValue(left) && isLikelyNumericValue(right)) {
    return parseVal(left) - parseVal(right);
  }
  return String(left || '').localeCompare(String(right || ''), 'es', { numeric: true, sensitivity: 'base' });
}

function renderTablePage() {
  const columns = currentProfile?.table?.columns || [];
  const total = tableData.length;
  const pages = Math.max(1, Math.ceil(total / TABLE_PAGE));
  if (currentPage > pages) currentPage = pages;
  const start = (currentPage - 1) * TABLE_PAGE;
  const end = Math.min(start + TABLE_PAGE, total);
  const slice = tableData.slice(start, end);

  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';

  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="${Math.max(columns.length, 1)}" style="text-align:center;color:var(--muted);padding:32px">Sin resultados</td></tr>`;
  } else {
    slice.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = columns.map(column => renderCell(row, column)).join('');
      tbody.appendChild(tr);
    });
  }

  document.getElementById('pag-info').textContent = `Mostrando ${total ? fmtNum(start + 1) : 0}–${fmtNum(end)} de ${fmtNum(total)} registros`;
  renderPagination(total, pages);
}

function renderCell(row, column) {
  const rawValue = row[column.field];
  const value = isNullValue(rawValue) ? '—' : rawValue;
  const alignStyle = column.align === 'right' ? 'text-align:right;font-variant-numeric:tabular-nums' : '';

  if (column.type === 'badge') {
    return `<td><span class="badge ${badgeClass(value)}">${escapeHtml(value)}</span></td>`;
  }
  if (column.type === 'currency') {
    return `<td style="${alignStyle}">${fmtCurrency(parseVal(rawValue))}</td>`;
  }
  if (column.type === 'bytes') {
    return `<td style="${alignStyle}">${fmtBytes(parseVal(rawValue))}</td>`;
  }
  if (column.type === 'date') {
    return `<td>${escapeHtml(fmtDateOnly(value))}</td>`;
  }
  if (column.type === 'number') {
    return `<td style="${alignStyle}">${escapeHtml(fmtNum(parseVal(rawValue)))}</td>`;
  }

  const text = column.truncate ? String(value).slice(0, column.truncate) : value;
  return `<td title="${escapeHtml(value)}">${escapeHtml(text)}</td>`;
}

function renderPagination(total, pages) {
  const container = document.getElementById('pag-btns');
  container.innerHTML = '';

  const makeBtn = (label, page, active = false, disabled = false) => {
    const button = document.createElement('button');
    button.className = 'pg-btn' + (active ? ' active' : '');
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener('click', () => {
      currentPage = page;
      renderTablePage();
    });
    return button;
  };

  container.appendChild(makeBtn('‹', currentPage - 1, false, currentPage === 1 || total === 0));
  pagRange(currentPage, pages).forEach(page => {
    if (page === '…') {
      const spacer = document.createElement('span');
      spacer.textContent = '…';
      spacer.style.cssText = 'padding:6px 8px;color:var(--muted)';
      container.appendChild(spacer);
    } else {
      container.appendChild(makeBtn(page, page, page === currentPage));
    }
  });
  container.appendChild(makeBtn('›', currentPage + 1, false, currentPage === pages || total === 0));
}

function pagRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '…', current - 1, current, current + 1, '…', total];
}

function renderNullAnalysis() {
  if (!allData.length) return;
  const total = allData.length;
  const fields = inferredFieldStats.map(item => item.field);
  const nullCounts = {};
  fields.forEach(field => { nullCounts[field] = 0; });

  allData.forEach(row => {
    fields.forEach(field => {
      if (isNullValue(row[field])) nullCounts[field] += 1;
    });
  });

  const sorted = Object.entries(nullCounts)
    .map(([field, count]) => ({ field, count, pct: (count / total) * 100 }))
    .sort((left, right) => right.count - left.count);

  const winner = sorted[0] || { field: 'N/D', count: 0, pct: 0 };
  document.getElementById('null-winner-name').textContent = winner.field;
  document.getElementById('null-winner-detail').textContent = `${fmtNum(winner.count)} nulos de ${fmtNum(total)} registros — ${winner.pct.toFixed(1)}% del total`;

  const top25 = sorted.slice(0, 25);
  destroyChart('chart-nulls');
  const ctx = document.getElementById('chart-nulls').getContext('2d');
  charts['chart-nulls'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top25.map(item => item.field),
      datasets: [{
        label: 'Nulos',
        data: top25.map(item => item.count),
        backgroundColor: top25.map(item => item.pct >= 80 ? '#ef4444' : item.pct >= 50 ? '#f59e0b' : item.pct >= 20 ? '#4f7cff' : '#22c55e'),
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => ` ${fmtNum(context.parsed.x)} nulos (${((context.parsed.x / total) * 100).toFixed(1)}%)`,
          },
        },
      },
      scales: {
        x: { grid: { color: '#1e2133' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
        y: { grid: { color: '#1e2133' }, ticks: { color: '#94a3b8', font: { size: 9 } } },
      },
    },
  });

  const tbody = document.getElementById('null-table-body');
  tbody.innerHTML = '';
  sorted.forEach((item, index) => {
    const completeness = 100 - item.pct;
    const barColor = completeness < 20 ? '#ef4444' : completeness < 50 ? '#f59e0b' : completeness < 80 ? '#4f7cff' : '#22c55e';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="null-rank">${index + 1}</td>
      <td style="font-family:monospace;font-size:0.75rem;color:var(--text)">${escapeHtml(item.field)}</td>
      <td style="text-align:right;font-variant-numeric:tabular-nums">${fmtNum(item.count)}</td>
      <td style="text-align:right" class="null-pct">${item.pct.toFixed(1)}%</td>
      <td class="null-bar-cell">
        <div class="null-bar-bg">
          <div class="null-bar-fill" style="width:${completeness.toFixed(1)}%;background:${barColor}"></div>
        </div>
        <div style="font-size:0.65rem;color:var(--muted);margin-top:2px">${completeness.toFixed(1)}% completo</div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

initApp().catch(error => {
  console.error(error);
  setStatus('error', `❌ Error al iniciar: ${error.message}`);
});

function setStatus(cls, msg) {
  const el = document.getElementById('status-badge');
  el.className = cls;
  el.textContent = msg;
}
