# PaperGuard

> **Copiloto de revisión editorial en español** · Hackathon Latam · Sub-track: Technical AI Safety

---

## Problema

Revisores y revistas reciben manuscritos con uso flojo o irresponsable de IA: referencias fantasmas, secciones inconsistentes, claims sin soporte. No existe herramienta en español orientada a asistir al revisor (no "detector mágico de autoría").

**Lo que PaperGuard NO promete:** detectar de forma infalible si un paper fue escrito por IA.  
**Lo que SÍ hace:** señalar secciones de riesgo, referencias no verificables e incoherencias editoriales para que el revisor trabaje con mejor foco.

---

## Solución

Pipeline: **PDF → Markdown estructurado → segmentación por secciones → RAG sobre el paper → análisis LLM → reporte dual en español.**

```
PDF upload
   │
   ▼
MarkItDown / pdfplumber   ← extracción + sanitización anti-injection
   │
   ▼
Markdown estructurado
   │
   ▼
Segmentador de secciones  ← abstract · intro · método · resultados · discusión · conclusión · refs
   │
   ▼
Embeddings + vectra        ← RAG sobre el propio paper
   │
   ▼
Claude Sonnet              ← análisis por sección + validación de citas
   │
   ▼
Reporte dual JSON          ← investigador (detallado) + revisor (resumen ejecutivo)
   │
   ▼
UI Next.js → Vercel        ← upload · progreso · reporte visual
```

---

## Stack

| Capa | Herramienta |
|---|---|
| Frontend / deploy | Next.js 14 App Router → Vercel |
| Backend / API | Next.js API Routes (monorepo, sin servicio separado) |
| Extracción PDF | `pdf-parse` (Node) — migrar a `pdfplumber` si la calidad es insuficiente* |
| PDF → Markdown | `markitdown` (Microsoft) |
| Embeddings | `@anthropic-ai/sdk` Claude embeddings |
| Vector store | `vectra` (in-memory, sin infra extra) |
| LLM | Claude Sonnet 4.x |
| Validación de citas | regex APA/IEEE + llamada a Claude |

> *Decisión a tomar en F1. Si se necesita `pdfplumber` (Python), se expone como Vercel Function.

---

## Backlog priorizado

### MUST — P1 (MVP para demo)

| # | Tarea | Fase |
|---|---|---|
| M1 | Extracción de texto PDF | F1 |
| M2 | Sanitización de input (bloquear prompt-injections en PDF) | F1 |
| M3 | Conversión a Markdown estructurado | F1 |
| M4 | Detector de texto IA — prompt a Claude Sonnet (score 0-100) | F2 |
| M5 | Detector de patrones — n-gramas + similitud coseno | F2 |
| M6 | Validación de citas APA/IEEE — regex + Claude | F3 |
| M7 | Reporte dual: JSON investigador + JSON revisor | F4 |
| M8 | UI mínima: upload PDF → spinner → reporte | F4 |

### SHOULD — P2 (si hay tiempo)

| # | Tarea | Fase |
|---|---|---|
| S1 | Segmentación automática de secciones | F1 |
| S2 | Detección de injections ocultas (texto invisible, metadatos) | F2 |
| S3 | Cruce claims vs referencias (afirmaciones sin fuente) | F3 |
| S4 | Score de confianza 0-100 por módulo en el reporte | F4 |
| S5 | Fragmentos resaltados (highlight) en UI | F4 |
| S6 | Paper de prueba con errores intencionados (demo) | F5 |

> **P3 (post-hackathon):** perplexity scoring · export PDF · soporte ES/EN · historial de análisis · pitch Latam IA Responsable.

---

## Fases de desarrollo

### Fase 0 — Setup (Día 0)
- [ ] Inicializar Next.js 14 + TypeScript
- [ ] Configurar variables de entorno (`ANTHROPIC_API_KEY`)
- [ ] Definir esquema JSON de salida compartido
- [ ] Configurar deploy en Vercel (`main` → producción)

### Fase 1 — Ingesta y Markdown (Día 1 · mañana)
- [ ] API route `/api/upload` — recibe PDF, extrae texto
- [ ] Sanitización anti-injection
- [ ] Conversión a Markdown con detección de secciones
- [ ] **Hito M1:** pipeline PDF → Markdown funcional end-to-end

### Fase 2 — Análisis IA y patrones (Día 1 · tarde)
- [ ] RAG: chunking + embeddings + vectra
- [ ] Prompt de detección IA por sección → score 0-100 + fragmentos sospechosos
- [ ] N-gramas + coseno para repetición de patrones
- [ ] **Hito M2:** score corriendo sobre paper real

### Fase 3 — Citas e injections (Día 2 · mañana)
- [ ] Regex APA/IEEE para extraer referencias
- [ ] Validación con Claude (coherencia + DOI)
- [ ] Detección de texto oculto / metadatos sospechosos
- [ ] Cruce claims vs referencias (P2)

### Fase 4 — Reporte y UI (Día 2 · tarde)
- [ ] Construir JSON dual (investigador / revisor)
- [ ] Score de confianza por módulo
- [ ] UI: upload → alertas por sección → reporte
- [ ] **Hito M3:** demo completa en Vercel

### Fase 5 — Pulido y demo (Día 3)
- [ ] Paper de prueba con errores intencionados
- [ ] Calibrar umbrales de score
- [ ] Preparar pitch 1 min: problema → solución → demo → track Latam

---

## Esquema JSON de salida

```jsonc
{
  "paper_id": "uuid",
  "idioma": "es",
  "secciones": {
    "abstract": {
      "texto": "...",
      "score_ia": 82,
      "score_confianza": 74,
      "alertas": ["Promete resultados no encontrados en sección de resultados"]
    },
    "metodologia": {
      "score_ia": 65,
      "alertas": ["Descripción vaga, pasos no reproducibles"]
    }
    // ... intro, resultados, discusion, conclusion
  },
  "referencias": [
    { "cita": "García et al., 2023", "estado": "no_verificada", "razon": "DOI no encontrado" }
  ],
  "reporte_investigador": {
    "resumen": "...",
    "alertas_detalladas": [],
    "score_global": 71
  },
  "reporte_revisor": {
    "nivel_riesgo": "medio",
    "puntos_criticos": [],
    "recomendacion": "Requiere revisión adicional en metodología y referencias"
  }
}
```

---

## Seguridad y ética

- El sistema **asiste**, no decide: toda alerta requiere revisión humana final.
- Manuscritos son confidenciales: sin persistencia ni logging de contenido.
- La UI debe indicar explícitamente que el análisis usa IA (Claude).
- MVP: procesamiento en memoria, sin guardar papers en servidor.

---

## Alineación con el hackathon

| Criterio | PaperGuard |
|---|---|
| Track | Latam · Technical AI Safety |
| Problema regional | Integridad académica en español; revistas latinoamericanas |
| Evaluación de sistemas IA | Detecta uso irresponsable de IA en contexto académico |
| Fairness/Safety para español | Modelo y reporte en español por defecto |
| Enfoque verificable | Señales con evidencia del paper (RAG), no juicio absoluto |

---

## Cómo validar el MVP

1. Subir `paper_prueba.pdf` (con errores intencionados) a la UI en Vercel.
2. Verificar que el JSON contiene scores y alertas por sección.
3. Verificar que referencias fantasmas aparecen como `no_verificada`.
4. Confirmar que la UI renderiza el reporte dual sin errores.
