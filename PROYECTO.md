# PaperGuard

> **Copiloto de revisión editorial en español** · Hackathon Latam · Sub-track: Technical AI Safety

---

## Problema

Revisores y revistas reciben manuscritos con uso flojo o irresponsable de IA: referencias fantasmas, secciones inconsistentes, claims sin soporte. No existe herramienta en español orientada a asistir al revisor (no "detector mágico de autoría").

**Lo que PaperGuard NO promete:** detectar de forma infalible si un paper fue escrito por IA.  
**Lo que SÍ hace:** señalar secciones de riesgo, referencias no verificables e incoherencias editoriales para que el revisor trabaje con mejor foco.

---

## Stack

| Capa | Herramienta | Deploy |
|---|---|---|
| Frontend | React + Vite + TypeScript + TailwindCSS | Vercel |
| Backend / API | Python 3.11 + FastAPI + uvicorn | Railway |
| Extracción PDF | `pdfplumber` (texto visible) + `pymupdf` (capas ocultas, bbox, metadata) | — |
| PDF → Markdown | `markitdown` (Microsoft) | — |
| Embeddings + RAG | `anthropic` SDK + `chromadb` in-memory | — |
| LLM | Claude Sonnet 4.x | — |
| Verificación de citas | CrossRef API + Semantic Scholar API (gratuitas) | — |
| Detección de parafraseo | n-gramas + coseno (`scikit-learn`) + prompt Claude | — |

> **¿Por qué Railway para FastAPI?** Vercel Python Functions tienen límite de 250 MB y no soportan `pdfplumber` + `pymupdf` + `chromadb` juntas. Railway corre Docker sin esas restricciones. El frontend en Vercel llama al backend en Railway por HTTPS.

---

## Estructura de carpetas

```
PaperGuard/
├── frontend/
│   └── src/
│       ├── components/     ← UploadForm, ReportView, SectionAlert, ScoreBadge
│       ├── pages/          ← Home, Report
│       └── api.ts          ← llamadas al backend
│
├── backend/
│   ├── main.py             ← app FastAPI
│   ├── routers/
│   │   └── audit.py        ← POST /audit, GET /audit/{id}
│   ├── services/
│   │   ├── extractor.py    ← pdfplumber + pymupdf
│   │   ├── segmenter.py    ← detección de secciones
│   │   ├── rag.py          ← chunking + embeddings + chromadb
│   │   ├── reporter.py     ← score global + reporte dual
│   │   └── checks/
│   │       ├── ai_detector.py   ← IA + parafraseo (Claude + n-gramas)
│   │       ├── injection.py     ← texto oculto, metadata, anotaciones
│   │       ├── citations.py     ← CrossRef + Semantic Scholar
│   │       ├── patterns.py      ← n-gramas + coseno (scikit-learn)
│   │       └── unsupported.py   ← claims sin respaldo (RAG + Claude)
│   ├── models.py           ← Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
│
├── PROYECTO.md
└── README.md
```

---

## Flujo de auditoría (6 fases)

### Fase 1 — Entrada y validación
```
POST /api/audit  (multipart: pdf file)
  ├─ validar MIME (application/pdf)
  ├─ validar tamaño (< 20 MB)
  ├─ validar no encriptado
  └─ validar texto extraíble (> 500 palabras) → si falla: 400 con motivo
```

### Fase 2 — Extracción
```
extractor.py
  ├─ pdfplumber  → texto visible por página + bloques con bbox
  ├─ pymupdf     → texto oculto (color=bg, font_size<1, fuera de viewport)
  │               metadata (Author, Creator, CreationDate, software)
  │               anotaciones y comentarios
  ├─ regex       → sección de referencias → parseo individual
  └─ segmenter.py → abstract · intro · método · resultados · discusión · conclusión · refs
```

### Fase 3 — Pre-check
```
IntakeResult JSON:
  ready_for_audit: bool
  secciones_detectadas: list
  texto_oculto_encontrado: bool
  referencias_raw: list
Si ready_for_audit=false → detener flujo, informar al usuario
```

### Fase 4 — Auditoría (5 checks en paralelo vía asyncio.gather)

```
┌─ 4.1 ai_detector.py   → Claude Sonnet por sección → score_ia 0-100
│                          + parafraseo (n-gramas coseno + prompt)
│
├─ 4.2 injection.py     → texto oculto + metadata + anotaciones
│                          → hallazgos con ubicación
│
├─ 4.3 citations.py     → CrossRef + Semantic Scholar por cada ref
│                          → % verificadas + lista no_encontradas
│
├─ 4.4 patterns.py      → TfidfVectorizer + coseno
│                          → fragmentos repetidos + % similitud
│
└─ 4.5 unsupported.py   → RAG: claims → verificar cita cercana
                           → afirmaciones sin respaldo
```

### Fase 5 — Consolidación
```
reporter.py
  ├─ combinar 5 resultados
  ├─ score_global ponderado:
  │    ai:30% · citations:25% · patterns:20% · unsupported:15% · injection:10%
  └─ veredicto: "Aprobado" | "Revisión manual" | "Rechazado"
```

### Fase 6 — Salida
```
reporte_investigador → semáforo 🟢🟡🔴, lenguaje simple, resumen por sección
reporte_revisor      → detalle técnico completo con evidencia y ubicación
dashboard React      → upload · progreso · reporte visual por sección
```

---

## Detección de parafraseo de IA

El parafraseo (texto IA retocado para evadir detectores) se ataca en dos capas dentro del check 4.1:

**Capa estadística:**
- N-gramas (bi/trigramas) + similitud coseno entre párrafos → uniformidad de estilo = señal
- Distribución de longitud de oraciones: IA tiende a oraciones similares en longitud

**Capa LLM (prompt a Claude):**
> "Analiza si este párrafo muestra señales de texto generado por IA y luego parafraseado: vocabulario inusualmente formal, transiciones genéricas, falta de especificidad técnica, coherencia superficial sin profundidad. Devuelve score 0-100 y razones."

Claude señala patrones lingüísticos de riesgo, no afirma autoría.

---

## Esquema JSON de salida

```jsonc
{
  "audit_id": "uuid",
  "idioma": "es",
  "ready_for_audit": true,
  "secciones": {
    "abstract": {
      "score_ia": 82,
      "score_confianza": 74,
      "alertas": ["Promete resultados no encontrados en sección de resultados"],
      "fragmentos_sospechosos": ["En este estudio se demuestra que..."]
    }
    // intro, metodologia, resultados, discusion, conclusion
  },
  "checks": {
    "ai_detector":  { "score": 78, "fragmentos": [] },
    "injection":    { "score": 0,  "hallazgos": [] },
    "citations":    { "score": 60, "no_encontradas": ["García et al., 2023"] },
    "patterns":     { "score": 45, "repetidos": [] },
    "unsupported":  { "score": 55, "sin_respaldo": [] }
  },
  "score_global": 71,
  "veredicto": "Revisión manual",
  "reporte_investigador": { "resumen": "...", "nivel_riesgo": "medio" },
  "reporte_revisor": {
    "detalle_por_check": {},
    "recomendacion": "Revisar metodología y referencias 3, 7, 12"
  }
}
```

---

## Backlog priorizado

### MUST — P1 (MVP para demo)
| # | Tarea | Fase |
|---|---|---|
| M1 | Setup FastAPI + estructura de carpetas backend | F0 |
| M2 | Setup React + Vite + Tailwind | F0 |
| M3 | Extracción texto visible (`pdfplumber`) + validaciones de entrada | F1 |
| M4 | Extracción texto oculto + metadata (`pymupdf`) | F2 |
| M5 | Segmentador de secciones | F2 |
| M6 | Check 4.1: detector IA + parafraseo (Claude + n-gramas) | F4 |
| M7 | Check 4.3: validación citas (CrossRef + Semantic Scholar) | F4 |
| M8 | Check 4.4: patrones repetitivos (scikit-learn coseno) | F4 |
| M9 | Consolidación + score global + reporte dual JSON | F5 |
| M10 | UI: upload → spinner → dashboard semáforo por sección | F6 |

### SHOULD — P2 (si hay tiempo)
| # | Tarea |
|---|---|
| S1 | Check 4.2: injection (texto oculto, anotaciones) |
| S2 | Check 4.5: claims sin respaldo (RAG + Claude) |
| S3 | Score de confianza 0-100 por módulo visible en UI |
| S4 | Fragmentos resaltados (highlight) en reporte |
| S5 | Paper de prueba con errores intencionados |

> **P3 (post-hackathon):** export PDF · soporte EN · historial · perplexity scoring.

---

## Deploy

| Servicio | Qué corre | Config |
|---|---|---|
| Vercel | Frontend React | `vercel.json` en `/frontend`, env `VITE_API_URL` |
| Railway | Backend FastAPI | `Dockerfile` en `/backend`, env `ANTHROPIC_API_KEY` |

CORS en FastAPI configurado para aceptar el dominio de Vercel.

---

## Seguridad y ética

- El sistema **asiste**, no decide: toda alerta requiere revisión humana final.
- Manuscritos son confidenciales: sin persistencia ni logging de contenido del paper.
- La UI debe indicar explícitamente que el análisis usa IA (Claude).
- No prometer "detección infalible de autoría IA" — el sistema detecta **señales de riesgo**.

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

1. `POST /api/audit` con PDF real → devuelve JSON con secciones detectadas.
2. Check 4.1 devuelve `score_ia` distinto de 0 en al menos una sección.
3. Check 4.3 marca al menos una referencia como `no_verificada`.
4. UI muestra semáforo por sección sin crashear.
5. Paper de prueba con errores → `veredicto: "Revisión manual"` o `"Rechazado"`.
