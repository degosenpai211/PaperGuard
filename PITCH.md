# PaperGuard — Documento de propuesta · Hackathon Latam 2026

> Copiloto de revisión editorial en español para detectar uso irresponsable de IA en manuscritos académicos.
> Sub-track: Technical AI Safety · Propuesta de adopción: universidades bolivianas y latinoamericanas.

---

## 1. El problema (medible y creciente)

El uso de LLMs en redacción científica genera una crisis de integridad editorial documentada:

| Evidencia | Cifra | Fuente |
|---|---|---|
| Resúmenes de manuscritos con texto probablemente generado por LLM | **23 %** | AACR 2024 |
| Referencias alucinadas encontradas en 51 papers aceptados en NeurIPS | **> 100** | Análisis NeurIPS |
| Tasa de alucinación en búsquedas de literatura científica (ChatGPT) | **47 %** | Arora et al., 2024 [2] |
| Falsa tasa positiva de detectores comerciales en autores no nativos en inglés | **> 30 %** | surveys [5] |

**Vacío regional:** los detectores disponibles (GPTZero, Turnitin AI, Copyleaks) están optimizados para inglés. No existe una herramienta en español orientada al revisor editorial, no al autor, con evidencia trazable en el texto.

**Bolivia y Latam como caso de uso concreto:**
Las revistas científicas bolivianas y latinoamericanas indexadas en Latindex, SciELO y Redalyc procesan miles de manuscritos al año sin acceso a herramientas de integridad asequibles. Los costos de suscripción a detectores comerciales oscilan entre $3–$20 USD por paper — prohibitivo para revistas universitarias de la región.

---

## 2. Base científica (estado del arte)

| # | Paper | Aporte a PaperGuard |
|---|---|---|
| [1] | **A Survey on Hallucination in LLMs** — arxiv:2311.05232 | Base conceptual: por qué los LLM generan texto convincente pero falso; justifica revisar coherencia, trazabilidad y evidencia, no solo "estilo IA". |
| [2] | **Hallucination Rates in Scientific Literature Searches (ChatGPT & Bard)** — PMC11153973 | Cuantifica el problema de referencias alucinadas en contexto académico real; fundamenta el check de verificación de citas (CrossRef + Semantic Scholar). |
| [3] | **AI Generated Text Detection** — arxiv:2601.03812 | Benchmark unificado HC3 + DAIGT v2; DistilBERT alcanza ROC-AUC 0.96; justifica el finetuning del detector textual sobre datos académicos. |
| [4] | **AI-generated Text Detection with GLTR (IberLEF)** — arxiv:2502.12064 | Adaptación de GLTR para español en contexto IberLEF; valida que la detección en español es técnicamente viable con modelos multilingües. |
| [5] | **AI-generated Text Detection: Comprehensive Review** — ScienceDirect S1574013725000693 | Vista general de métodos, datasets y límites; fundamenta que la detección automática existe pero es imperfecta y necesita RAG + revisión humana. |
| [+] | **DagPap24 — Detecting Scientific Papers** — ACL 2024.sdp-1.2 | Unique: detecta contenido generado incrustado en papers académicos reales, no texto genérico; el benchmark más cercano al caso de uso de PaperGuard. |

---

## 3. Delimitación del problema (scope cerrado y medible)

| Dimensión | Límite |
|---|---|
| **Idioma** | Español (primera versión); arquitectura multilingüe extensible a portugués |
| **Documento** | Paper académico en PDF → Markdown |
| **Secciones** | Abstract, Introducción, Metodología, Resultados, Discusión, Conclusión, Referencias |
| **Señal detectada** | Párrafos genéricos (score IA), referencias no verificables, incoherencias entre secciones |
| **Output** | Score de riesgo 0–100 por sección + reporte en español con evidencia puntual |
| **Usuario** | Revisor editorial / editor de revista en Latam |
| **Lo que NO hace** | No decide aceptación/rechazo; no es detector infalible de autoría; no analiza imágenes ni tablas |

---

## 4. Métricas medibles

### 4.1 Detector de texto IA (ai_detector)

| Métrica | Descripción | Baseline SOTA (ref. [3]) |
|---|---|---|
| **Accuracy** | % de secciones correctamente clasificadas (humano / IA / mixto) | DistilBERT: 94 % en HC3 |
| **Precision** | De las marcadas "riesgo IA", cuántas realmente lo son | — |
| **Recall** | De las problemáticas reales, cuántas detecta | — |
| **F1-Score** | Balance Precision/Recall para comparar con SOTA | RoBERTa: 0.93 en DAIGT |
| **ROC-AUC** | Separación texto humano vs IA en distintos umbrales | 0.96 (DistilBERT, ref. [3]) |

> **Objetivo para el MVP:** F1 ≥ 0.80 en secciones de papers en español (evaluado sobre muestra manual de 20–30 papers).

### 4.2 Verificación de referencias (citations)

| Métrica | Descripción | Objetivo MVP |
|---|---|---|
| **% referencias verificadas** | Citas encontradas en CrossRef o Semantic Scholar | Medir sobre el paper de prueba |
| **% ghost refs** | Referencias no encontradas en ninguna base | Detectar al menos 1 en papers con errores intencionados |

### 4.3 Cobertura editorial

| Métrica | Descripción |
|---|---|
| **% secciones detectadas / total** | Qué tan bien el segmentador identifica la estructura del paper |
| **Tiempo de revisión asistida** | Estimado: 2–5 min vs ~45 min revisión manual completa |

### 4.4 Calidad del RAG (P2)

| Métrica | Descripción |
|---|---|
| **Faithfulness** | Proporción de alertas respaldadas en texto recuperado del paper |
| **Answer Relevance** | Relevancia de los fragmentos que el RAG recupera para cada alerta |

---

## 5. Límites honestos del sistema

1. **No es un oráculo de autoría.** Los mejores detectores alcanzan F1 ≈ 0.93 en inglés; en español el rendimiento es menor. El sistema señala riesgos — el revisor decide.
2. **No detecta imágenes ni datos tabulares fabricados.** Solo analiza texto extraído del PDF.
3. **Límite de contexto del LLM.** Papers de más de ~8 000 tokens requieren chunking; secciones muy largas pueden degradar el análisis.
4. **Dataset en español limitado.** Los benchmarks principales (HC3, DAIGT) están en inglés; el finetuning del detector necesitará datos propios en español para alcanzar el baseline SOTA.
5. **Dependencia de APIs externas.** CrossRef, Semantic Scholar y HuggingFace Inference son servicios de terceros con límites de rate.
6. **No reemplaza el juicio editorial.** Es un copiloto — la decisión final es siempre humana (requerimiento ético explícito del proyecto).

---

## 6. Escalabilidad

| Dimensión | Decisión de diseño | Impacto |
|---|---|---|
| **Modularidad** | Cada check es un servicio independiente (ai_detector, citations, patterns, injection, unsupported) | Reemplazable sin rehacer la arquitectura |
| **Costo marginal** | Embeddings + búsqueda vectorial (ChromaDB in-memory) para RAG | Sin crecimiento lineal de costos por paper |
| **Multilingüe** | Modelo base XLM-RoBERTa / mDeBERTa ya soporta ES, PT y otros idiomas ibéricos | Expansión a portugués con ajuste mínimo |
| **Modelo intercambiable** | `HF_MODEL_ID` en variable de entorno | Cambiar al modelo fine-tuned sin modificar código |
| **Deploy stateless** | Sin base de datos (PROYECTO.md §Seguridad) — store en memoria por sesión | Escala horizontal con Railway/Docker |
| **Límite actual** | Papers > 8 000 tokens necesitan chunking antes del análisis LLM | Implementable como P2 |

---

## 7. Propuesta de adopción — Bolivia y Latam

### Caso de uso inmediato
Las universidades públicas bolivianas (UMSA, UMSS, UAGRM, UAB) y las revistas indexadas en SciELO Bolivia y Latindex procesan manuscritos en español sin acceso a herramientas de integridad asequibles.

**PaperGuard puede ofrecerse como:**
- Herramienta gratuita (open-source, Railway + Vercel gratis tier) para revistas universitarias
- API REST consumible desde los sistemas de gestión editorial existentes (OJS — Open Journal Systems, estándar en Latam)
- Módulo de capacitación para revisores: el reporte explica cada señal con evidencia del texto, educando al revisor sobre patrones de riesgo

### Por qué Bolivia es un buen primer mercado
| Factor | Detalle |
|---|---|
| Vacío de herramientas | No existe equivalente en español con enfoque en el revisor |
| Costo | Deploy gratuito en tier inicial; sin costo por paper para la revista |
| OJS prevalente | ~90 % de revistas indexadas en Latindex Bolivia usan OJS → integración directa vía plugin |
| Comunidad académica activa | SciELO Bolivia, UMSA, UMSS publican cientos de artículos/año en español |
| Escalabilidad regional | Mismo stack sirve a Colombia, Argentina, México sin cambios de arquitectura |

---

## 8. Estructura del pitch (5 min)

| Slide | Contenido |
|---|---|
| 1 | **Problema** — "El 23 % de los abstracts ya tienen texto IA y los detectores existentes no hablan español" |
| 2 | **Solución** — PaperGuard: copiloto de revisión, no detector mágico. Demo en vivo (upload → semáforo). |
| 3 | **Métricas** — F1 ≥ 0.80 objetivo; % ghost refs; tiempo 2–5 min vs 45 min manual |
| 4 | **Límites** — Honestidad = credibilidad. No reemplaza al revisor. No es infalible. |
| 5 | **Escala** — Bolivia → Latam → OJS plugin. Open-source. Gratis para revistas universitarias. |

---

## Referencias

1. Zhang et al. (2023). *A Survey on Hallucination in Large Language Models*. arXiv:2311.05232
2. Arora et al. (2024). *Hallucination Rates and Reference Accuracy of ChatGPT and Bard*. PMC11153973
3. Shijaku & Canhasi (2025). *AI Generated Text Detection*. arXiv:2601.03812
4. Menta et al. (2025). *AI-generated Text Detection with a GLTR-based Approach (IberLEF)*. arXiv:2502.12064
5. Ghosal et al. (2025). *AI-generated Text Detection: A Comprehensive Review*. ScienceDirect S1574013725000693
6. Kashnitsky et al. (2024). *DagPap24: Detecting Automatically Generated Scientific Papers*. ACL 2024.sdp-1.2
