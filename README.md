# 📊 Dashboard SECOP II - Multi-Dataset Integrado

Análisis y visualización interactiva de **3 datasets de contratación pública** en Colombia con **18 preguntas respondidas**.

## 🎯 Contenido

- **Dashboard Interactivo Multi-Dataset**: 3 fuentes de datos (Socrata + Local)
- **Análisis Final**: respuestas consolidadas del dataset 2025
- **API Multi-Dataset**: consumo de datos para el dashboard

## 🚀 Acceso Rápido

- 📊 [Dashboard](./dashboard.html) - Visualización interactiva (3 datasets)
- 📋 [Análisis SECOP II 2025](./ANALISIS_SECOP_II_RESPUESTAS.md) - Respuestas detalladas
- 📖 [Documento Final](./ENTREGA_FINAL.md) - Resumen ejecutivo
- ⚙️ [Configuración](./config/datasets.json) - Registry de datasets

## 📊 Estadísticas Clave

| Métrica | Valor |
|---------|-------|
| Total Contratos | 1,003,902 |
| Período | 2025 (99.56%) |
| Entidades Públicas | 3,942 |
| Modalidad Dominante | Contratación Directa (75.7%) |
| Valor Total Estimado | $16.15+ billones COP |
| Participación Femenina | 43.24% |

## 🔗 Los 3 Datasets Integrados

### 1️⃣ **Dataset: SECOP II - Contratos Públicos** (Socrata)
```json
{
  "id": "jbjy-vk9h",
  "recordCount": "~150,000+",
  "dimensions": ["departamento", "sector", "estado_contrato", "tipo_de_contrato"]
}
```

### 2️⃣ **Dataset: SECOP II - Documentos Electrónicos** (Socrata)
```json
{
  "id": "dmgg-8hin",
  "recordCount": "~50,000+",
  "analysis": ["por_tipo_archivo", "por_entidad", "tamaño_archivo"]
}
```

### 3️⃣ **Dataset: SECOP II - Contratos Electrónicos 2025** (Local CSV)
```json
{
  "id": "secop-contratos-local",
  "recordCount": 1003902,
  "variables": 84,
  "analyzed": "18 preguntas respondidas"
}
```

**Acceso detallado**: Ver [ANALISIS_SECOP_II_RESPUESTAS.md](./ANALISIS_SECOP_II_RESPUESTAS.md)

## 📋 Top 10 Departamentos

1. 🏛️ Bogotá - 280,248 contratos
2. 📍 Valle del Cauca - 109,856 contratos
3. 🏔️ Antioquia - 105,810 contratos
4. 🌳 Cundinamarca - 49,499 contratos
5. ⛰️ Santander - 47,128 contratos
6. 🌊 Magdalena - 32,097 contratos
7. 🌴 Bolívar - 31,612 contratos
8. 🏖️ Atlántico - 31,428 contratos
9. 📐 Boyacá - 30,849 contratos
10. 🌾 Tolima - 27,823 contratos

## 🎯 Las 18 Preguntas Respondidas

| # | Pregunta | Respuesta |
|----|----------|-----------|
| 1 | Número de registros | **1,003,902** |
| 2 | Número de variables | **84** |
| 3 | Registros 2025 | **999,490 (99.56%)** |
| 4 | Proporción Pymes (%) | **13.20%** |
| 5 | Número contratos Pymes | **132,479** |
| 6 | Top 10 departamentos | Ver tabla arriba ↑ |
| 7 | Contratos Magdalena | **32,097** |
| 8 | Modalidad preferida | **Contratación directa** |
| 9 | Contratos modalidad | **759,993 (75.7%)** |
| 10 | Top 3 entidades $ | **$16.15 billones** |
| 11 | Top 5 tipos contrato | Prestación servicios (85.76%) |
| 12 | % tipo dominante | **85.76%** |
| 13 | Top 3 anomalías financieras | Ministerios validados ✅ |
| 14 | % pagos adelantados | **~5.7%** |
| 15 | Obligaciones ambientales | **21,347 (2.1%)** |
| 16 | ¿Pareto 80/20? | **✅ SÍ (parcial)** |
| 17 | Brecha género | **43.24% Mujeres vs 37.67% Hombres** |
| 18 | Anomalías datos | **6 anomalías identificadas** |

**Análisis completo**: [ANALISIS_SECOP_II_RESPUESTAS.md](./ANALISIS_SECOP_II_RESPUESTAS.md)

## 🔍 Análisis Destacado

### Comparativa de Tipos de Contrato
- **Prestación de Servicios**: 85.76% (860,913 contratos) ⭐ DOMINANTE
- **Decreto 092 de 2017**: 4.12% (41,384 contratos)
- **Otros**: 3.75% (37,616 contratos)
- **Suministros**: 2.26% (22,669 contratos)
- **Compraventa**: 1.68% (16,845 contratos)

### Top 3 Entidades por Dinero Ejecutado
1. 💡 Distrito Especial de Ciencia Tecnología e Innovación de Medellín: **$7.19 billones**
2. ⚡ Ministerio de Minas y Energía: **$5.12 billones**
3. 🏢 Departamento de Antioquia: **$3.84 billones**

### Género en Representación Legal
- 👩 Mujeres: **43.24%** (Participación mayoritaria)
- 👨 Hombres: **37.67%** 
- ❓ No Definido: **18.82%**
- 🔄 Otro: **0.26%**

**Conclusión**: Brecha de género **positiva**, con mayor participación femenina en decisiones de contratación.

### Principio de Pareto (80/20)
✅ **CONFIRMADO PARCIALMENTE**
- 20% de entidades concentran ~80% del dinero
- Bogotá concentra 27.9% de todos los contratos
- Top 3 departamentos: 49.3% de concentración

## 📂 Estructura del Proyecto

```
├── README.md                        # Este archivo
├── dashboard.html                   # Dashboard interactivo multi-dataset
├── dashboard-app.js                 # Lógica del dashboard
├── config/
│   ├── datasets.json               # Registry de 3 datasets
│   └── runtime.js                  # Configuración runtime
├── ANALISIS_SECOP_II_RESPUESTAS.md  # Respuestas detalladas
├── ENTREGA_FINAL.md                 # Resumen final
├── workers/
│   └── api/
│       ├── worker.js               # Cloudflare Worker API
│       ├── wrangler.toml           # Config Worker
│       └── package.json
└── SECOP_II_-_Contratos_Electrónicos_20260506.csv  # Dataset local (1M+ filas)
```

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Chart.js)
- **Backend**: DuckDB, Python, Cloudflare Workers
- **Data**: CSV (1M+ registros), JSON config
- **Hosting**: GitHub Pages + Cloudflare Workers
- **CI/CD**: GitHub Actions

## 🚀 Despliegue

### Local
```bash
# Abrir dashboard directamente
open dashboard.html

# O servir con Python
python3 -m http.server 8000
```

### GitHub Pages
El repositorio está configurado para usar GitHub Pages automáticamente.

**URL**: https://felipedc09.github.io/reto-stress-cibersecurity

### Cloudflare Worker (API)
```bash
cd workers/api
wrangler deploy
```

## 📊 Dashboard Features

- ✅ Multi-dataset selector
- ✅ Filtros dinámicos (Departamento, Modalidad, Tipo)
- ✅ KPIs ejecutivos
- ✅ Gráficos interactivos
- ✅ Tabla paginada de datos
- ✅ Análisis de valores nulos
- ✅ Exportación de datos

## 🔗 APIs Disponibles

- `GET /api/health` - Health check
- `GET /api/rows?domain=...&resourceId=...` - Obtener registros
- `GET /api/aggregate?datasetId=...` - Obtener agregados

## 📖 Resultado Final

- [Análisis Completo SECOP II 2025](./ANALISIS_SECOP_II_RESPUESTAS.md)
- [Entrega Final](./ENTREGA_FINAL.md)
- [Dashboard](./dashboard.html)

## 🎯 Estado

- [x] Dashboard multi-dataset funcional
- [x] API configurada
- [x] Análisis final consolidado

## 📞 Contacto

Para preguntas o sugerencias sobre este análisis, contacta al equipo de análisis de datos.

---

**Generado**: 8 de mayo de 2026  
**Dataset**: SECOP II - Contratos Electrónicos 2025  
**Estado**: ✅ LISTO PARA PRODUCCIÓN
