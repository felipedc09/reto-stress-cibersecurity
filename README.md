# 📊 Dashboard SECOP II - Contratos Electrónicos 2025

Análisis y visualización interactiva de datos de contratación pública en Colombia.

## 🎯 Contenido

- **Dashboard Interactivo**: Análisis visual de 1,003,902 contratos públicos
- **Análisis Detallado**: 18 preguntas respondidas sobre el dataset
- **API Multi-Dataset**: Integración con múltiples fuentes de datos
- **Documentación Completa**: Guías de uso y arquitectura técnica

## 🚀 Acceso Rápido

- 📊 [Dashboard](./dashboard.html) - Visualización interactiva
- 📋 [Análisis Completo](./ANALISIS_SECOP_II_RESPUESTAS.md) - 18 preguntas respondidas
- 📖 [Documento de Entrega](./ENTREGA_FINAL.md) - Resumen ejecutivo
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

## 🔍 Análisis Destacado

### Tipos de Contrato
- **Prestación de Servicios**: 85.76% (860,913 contratos)
- **Decreto 092 de 2017**: 4.12% (41,384 contratos)
- **Otros**: 3.75% (37,616 contratos)

### Top 3 Entidades por Dinero
1. 💡 Distrito Especial de Ciencia Tecnología e Innovación de Medellín: $7.19 billones
2. ⚡ Ministerio de Minas y Energía: $5.12 billones
3. 🏢 Departamento de Antioquia: $3.84 billones

### Género en Representación Legal
- 👩 Mujeres: 43.24%
- 👨 Hombres: 37.67%
- ❓ No Definido: 18.82%

## 📂 Estructura del Proyecto

```
├── dashboard.html              # Dashboard interactivo principal
├── dashboard-app.js            # Lógica del dashboard
├── config/
│   ├── datasets.json          # Registry de datasets
│   └── runtime.js             # Configuración de runtime
├── scripts/
│   └── pipeline/
│       ├── build_aggregates.py    # Pipeline de agregación
│       └── prepare_pages_bundle.py # Generador de bundle
├── workers/
│   └── api/
│       └── worker.js          # Cloudflare Worker API
├── docs/
│   ├── IMPLEMENTATION.md       # Documentación técnica
│   └── DATASET_ONBOARDING.md   # Guía de onboarding
└── data/
    └── SECOP_II_-_Contratos_Electrónicos_20260506.csv
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

## 📖 Documentación

- [Análisis Completo](./ANALISIS_SECOP_II_RESPUESTAS.md) - Respuestas detalladas
- [Entrega Final](./ENTREGA_FINAL.md) - Documento de entrega
- [Implementación Técnica](./docs/IMPLEMENTATION.md) - Arquitectura
- [Onboarding de Datasets](./docs/DATASET_ONBOARDING.md) - Guía

## 🎯 Próximos Pasos

- [ ] Desplegar en GitHub Pages
- [ ] Configurar API en Cloudflare Workers
- [ ] Agregar más datasets públicos
- [ ] Implementar alertas automáticas
- [ ] Crear reportes ejecutivos mensuales

## 📞 Contacto

Para preguntas o sugerencias sobre este análisis, contacta al equipo de análisis de datos.

---

**Generado**: 8 de mayo de 2026  
**Dataset**: SECOP II - Contratos Electrónicos 2025  
**Estado**: ✅ LISTO PARA PRODUCCIÓN
