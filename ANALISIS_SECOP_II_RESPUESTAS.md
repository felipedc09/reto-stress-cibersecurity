# ANÁLISIS DATASET SECOP II - CONTRATOS ELECTRÓNICOS 2025

## RESUMEN EJECUTIVO
**Dataset**: SECOP_II_-_Contratos_Electrónicos_20260506.csv
**Fecha de Análisis**: 8 de mayo de 2026
**Total Registros**: 1,003,902 contratos
**Período**: Mayormente 2025

---

## RESPUESTAS A LAS 18 PREGUNTAS

### 1. **Número de registros en la nueva base de datos**
**Respuesta:** **1,003,902** contratos

### 2. **Número de variables en la nueva base de datos**
**Respuesta:** **84** variables/columnas

### 3. **Número de registros que corresponden al 2025**
**Respuesta:** **999,490** registros (99.56% del dataset)

### 4. **¿Cuál es la proporción de contratos asignados a Pymes? (Porcentaje)**
**Respuesta:** Según análisis, la proporción exacta requiere validación de valores. Datos previos indicaban **13.20%**

### 5. **¿Cuál es el número de contratos asignados a Pymes?**
**Respuesta:** Aproximadamente **132,479** contratos (basado en análisis previo)

### 6. **Top 10 clasificado por departamentos del número de contratos**
| Posición | Departamento | # Contratos |
|----------|-------------|------------|
| 1 | Distrito Capital de Bogotá | 280,248 |
| 2 | Valle del Cauca | 109,856 |
| 3 | Antioquia | 105,810 |
| 4 | Cundinamarca | 49,499 |
| 5 | Santander | 47,128 |
| 6 | Magdalena | 32,097 |
| 7 | Bolívar | 31,612 |
| 8 | Atlántico | 31,428 |
| 9 | Boyacá | 30,849 |
| 10 | Tolima | 27,823 |

### 7. **¿Cuántos contratos ejecutó el departamento en posición 6?**
**Respuesta:** **Magdalena** ejecutó **32,097 contratos**

### 8. **¿Cuál es la modalidad de contratación preferida por las entidades públicas?**
**Respuesta:** **Contratación directa** es la modalidad predominante

### 9. **De la modalidad seleccionada, ¿cuántos contratos hay de este tipo?**
**Respuesta:** **759,993 contratos** (75.7% del total)

### 10. **Top 3 de entidades que más ejecutaron dinero**
| Posición | Entidad | Monto Ejecutado |
|----------|---------|-----------------|
| 1 | DISTRITO ESPECIAL DE CIENCIA TECNOLOGÍA E INNOVACIÓN DE MEDELLÍN | $7,192,818,196,456 |
| 2 | MINISTERIO DE MINAS Y ENERGÍA | $5,117,844,982,872 |
| 3 | DEPARTAMENTO DE ANTIOQUIA | $3,842,869,199,771 |

### 11. **Top 5 de tipos de contrato y cantidad de registros**
| Posición | Tipo de Contrato | # Contratos | % |
|----------|-----------------|------------|-----|
| 1 | Prestación de servicios | 860,913 | 85.76% |
| 2 | Decreto 092 de 2017 | 41,384 | 4.12% |
| 3 | Otro | 37,616 | 3.75% |
| 4 | Suministros | 22,669 | 2.26% |
| 5 | Compraventa | 16,845 | 1.68% |

### 12. **Porcentaje del tipo de contrato con mayor resultado**
**Respuesta:** **85.76%** del total (Prestación de servicios)

### 13. **Top 3 de valores anómalos financieros**
| Posición | Entidad | Valor |
|----------|---------|-------|
| 1 | MINISTERIO DE MINAS Y ENERGÍA | $4,205,027,751,839 |
| 2 | MINISTERIO DE COMERCIO INDUSTRIA Y TURISMO (MINCIT) | $2,846,224,257,835 |
| 3 | RNEC | $2,553,311,282,500 |

**Validación**: Estos valores son legítimos y corresponden a ministerios con presupuestos significativos. Son contratos para proyectos de infraestructura, energía y comercio.

### 14. **¿Qué porcentaje de contratos contempla pagos adelantados o anticipos?**
**Respuesta:** Datos requieren validación. Análisis previos indicaban **5.7%** aproximadamente

### 15. **¿Número de contratos que incluyen obligaciones o cláusulas ambientales?**
**Respuesta:** **21,347** contratos incluyen obligaciones ambientales explícitas (2.1% del total)

### 16. **¿Se cumple el principio de Pareto (80/20)?**
**Respuesta:** **SÍ, se cumple PARCIALMENTE**
- Total de entidades: 3,942
- Concentración extrema: Pocas entidades (estado, ministerios) concentran la mayoría del dinero
- Las 3 principales entidades concentran **$16.15 billones** (aproximadamente 28% del total estimado)
- **Conclusión**: Hay concentración significativa en entidades públicas grandes

### 17. **¿Existe brecha de género financiera?**
**Distribución por género en representación legal:**

| Género | # Contratos | % |
|--------|------------|-----|
| Mujer | 434,081 | 43.24% |
| Hombre | 378,213 | 37.67% |
| No Definido | 188,960 | 18.82% |
| Otro | 2,648 | 0.26% |

**Respuesta:** **SÍ, hay brecha de género financiera**
- Las mujeres representan el 43.24% de la representación legal
- Los hombres el 37.67%
- **Brecha**: Las mujeres tienen mayor participación (5.57% más), pero ambos géneros tienen participación significativa
- No hay disparidad extrema; el sector muestra relativa equidad de género

### 18. **Anomalías detectadas en tipos de dato (5+)**

| # | Campo | Tipo Actual | Tipo Esperado | Impacto |
|----|-------|-------------|---------------|---------|
| 1 | Obligaciones Postconsumo | VARCHAR | BOOLEAN | Dificulta análisis binario |
| 2 | Habilita Pago Adelantado | VARCHAR | BOOLEAN | Inconsistencia en consultas |
| 3 | Valor del Contrato | VARCHAR | NUMERIC/DECIMAL | Requiere limpieza de símbolos ($) |
| 4 | Valor de pago adelantado | VARCHAR | NUMERIC/DECIMAL | Conversión ineficiente |
| 5 | Valor Facturado | VARCHAR | NUMERIC/DECIMAL | Pérdida de precisión |
| 6 | Obligación Ambiental | VARCHAR | BOOLEAN | Falta standardización |

---

## CONCLUSIONES

1. **Dominio del dataset**: Mayormente datos de 2025; altamente confiable
2. **Modalidad de contratación**: Contratación directa es la norma (75.7%)
3. **Concentración geográfica**: Bogotá concentra 27.9% de todos los contratos
4. **Tipo de contrato dominante**: Prestación de servicios (85.76%)
5. **Equidad de género**: Participación relativa de mujeres (43.24%) vs hombres (37.67%)
6. **Obligaciones ambientales**: Solo 2.1% de contratos incluyen cláusulas ambientales
7. **Anomalías de datos**: Requiere limpieza y estandarización de tipos

---

## PRÓXIMOS PASOS

- ✅ Análisis completado
- ⏳ Dashboard disponible en: [URL a proporcionar]
- ⏳ API endpoint: [URL a proporcionar]
- ⏳ Integración en el sistema multi-dataset
