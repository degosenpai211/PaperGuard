# PaperGuard: A RAG-Augmented Editorial Copilot for Detecting Irresponsible AI Use in Spanish-Language Academic Manuscripts

**Author name 1** — Dax kenji Tellez Duran  
**Author name 2** — Diego Armando Sarmiento Osinaga  
**Author name 3** — Sara Raquel Saunero Salas  
**Author name 4** — Andrew Maddox Taborga Coca  
**Author name 5** — Fabio Andres Puma Menchaca

*With Apart Research*

---

## Abstract

The proliferation of large language models (LLMs) in academic writing has created a measurable integrity crisis: approximately 23% of biomedical conference abstracts show evidence of LLM-generated text (AACR 2024), and over 100 hallucinated references were found in accepted NeurIPS papers. Existing detection tools—GPTZero, Turnitin AI, Copyleaks—are optimized for English and focus on authorship attribution rather than editorial support, producing false positive rates above 30% for non-native English writers.

PaperGuard is an open-source editorial copilot in Spanish that analyzes academic PDF manuscripts through a five-module pipeline: AI-content detection (Claude Sonnet with HuggingFace fallback), citation verification (CrossRef + Semantic Scholar in parallel), repetition and stylistic uniformity analysis (TF-IDF cosine + sentence-length variance), prompt injection detection (hidden text and metadata inspection), and unsupported-claim detection (RAG-grounded Claude analysis). All five checks run in parallel via `asyncio.gather` and produce a dual report: a plain-language risk summary for the author and a detailed technical report for the reviewer.

Evaluated on a manually curated set of papers with intentional errors, PaperGuard correctly flags AI-generated sections, unverifiable references, and stylistic anomalies with scores that correlate with the severity of planted issues. The system is deployed on Railway (FastAPI backend) and Vercel (React frontend), targets Spanish-language journals on SciELO, Latindex, and Redalyc, and is designed for integration with Open Journal Systems (OJS), the editorial management standard in Latin America.

---

## 1. Introduction

Academic journals face an unprecedented challenge: LLM-generated or LLM-assisted manuscripts that superficially pass human review but contain hallucinated references, inconsistent methodology sections, unsupported claims, and generic prose that lacks the specificity expected of original research. The problem is especially acute in Spanish-language academic publishing, where no affordable, reviewer-oriented tool exists.

Current detection tools fail in two directions. First, they are designed for authorship attribution—answering "was this written by AI?"—rather than editorial support—answering "what should a reviewer look at more carefully?". This framing leads to binary verdicts that editors cannot act on. Second, they are trained and optimized on English corpora, producing unacceptable false positive rates for non-native writers (Ghosal et al., 2025 [5]).

PaperGuard reframes the problem: instead of attributing authorship, it identifies editorial risk signals—sections with AI-typical prose patterns, references that cannot be verified in academic databases, claims without supporting citations, and hidden prompt-injection content—and presents them to the reviewer with textual evidence from the paper itself.

**Our main contributions are:**

1. **A five-module parallel audit pipeline** that combines LLM-based analysis (Claude Sonnet), statistical NLP (TF-IDF cosine similarity, sentence-length coefficient of variation), and live API verification (CrossRef, Semantic Scholar) into a single, fast audit (under 15 seconds for a typical paper).
2. **A RAG-grounded unsupported-claim detector** that uses the paper's own text as a retrieval corpus, ensuring every flagged claim is traceable to a specific passage rather than a model hallucination.
3. **A dual-report output** (plain-language for authors, technical for reviewers) aligned with the editorial workflow of Latin American journals, and a deployment architecture (Railway + Vercel, open-source, zero per-paper cost) that makes the tool accessible to university-run journals in the region.

---

## 2. Related Work

**LLM text detection benchmarks.** Shijaku & Canhasi (2025) [3] benchmark multiple classifiers on HC3 and DAIGT v2, with DistilBERT achieving ROC-AUC 0.96 and RoBERTa F1 0.93. These results establish strong baselines in English. Menta et al. (2025) [4] adapt GLTR-based detection to Spanish in the IberLEF shared task, confirming that multilingual models (XLM-RoBERTa) can transfer detection capability to Spanish with moderate fine-tuning.

**Hallucinated references.** Arora et al. (2024) [2] measure a 47% hallucination rate in scientific literature searches conducted with ChatGPT and Bard, documenting that AI-assisted writing frequently introduces fabricated or misattributed citations that pass casual review. This directly motivates our citation verification module.

**Scientific paper detection.** Kashnitsky et al. (2024) [6] present DagPap24, a shared task specifically targeting AI-generated content embedded within otherwise-legitimate academic papers—the closest published benchmark to PaperGuard's use case. Their findings show that mixed-authorship documents (partially AI, partially human) are significantly harder to detect than fully generated ones.

**Comprehensive reviews and limitations.** Ghosal et al. (2025) [5] survey detection methods and confirm that no current tool achieves reliable performance across languages, domains, and paraphrase attacks. This evidence base is central to PaperGuard's design decision to present risk signals with textual evidence rather than binary verdicts.

**Gap addressed.** No existing tool combines citation verification, stylistic analysis, and LLM-based content assessment into a single editorial workflow for Spanish-language journals. PaperGuard targets this gap with an open-source, zero-cost deployment designed for Latin American journal infrastructure.

---

## 3. Methods

### 3.1 Document Ingestion and Validation

PDF manuscripts are uploaded via a React frontend. The backend (FastAPI, Python 3.11) validates MIME type, file size (≤ 20 MB), encryption status, and minimum extractable text (≥ 500 words). Rejection at this stage returns a structured error to the user with the specific reason.

Text extraction uses `pdfplumber` for visible text (preserving page and block structure) and `pymupdf` (PyMuPDF / fitz) for hidden-layer analysis: zero-size font spans, text with foreground color matching background, out-of-viewport content, document metadata, and embedded annotations. Section segmentation uses language-aware regex patterns matching Spanish and English headings (abstract/resumen, introducción, metodología, resultados, discusión, conclusión, referencias/bibliografía). Reference extraction applies a regex over the references section to isolate individual entries for downstream verification.

### 3.2 Five-Module Parallel Audit

All five modules receive the extracted text (and, where relevant, the raw PDF bytes) and execute concurrently via `asyncio.gather`. Results are combined in a consolidation step that computes a weighted global score.

**Module 4.1 — AI Content Detector (`ai_detector`).** Claude Sonnet (`claude-sonnet-4-5-20251001`) receives the first 4,000 words of the manuscript with a structured prompt requesting a JSON response containing: an integer risk score (0–100), up to four suspicious text fragments (≤ 120 characters each), and up to three concrete reasons (e.g., "generic transitions", "absence of technical specificity"). The prompt instructs Claude to look for stylistic markers associated with LLM-generated prose: uniformly formal vocabulary, prototype phrases ("it is important to note", "in this context"), lack of authorial voice, and surface-level coherence without argumentative depth. If Claude fails (network error, API timeout), the module falls back to the HuggingFace Inference API using `Hello-SimpleAI/chatgpt-detector-roberta`, mapping AI-labeled class scores to the 0–100 range.

**Module 4.2 — Prompt Injection Detector (`injection`).** PyMuPDF inspects each page's text spans for font size < 1 pt (invisible text), and scans document metadata fields for keywords associated with LLM usage (e.g., "gpt", "chatgpt", "openai", "claude", "ai-generated"). Each finding is recorded with type, page number, and a 60-character preview. Score is capped at 100, with each finding contributing 20 points.

**Module 4.3 — Citation Verifier (`citations`).** Up to 20 extracted references are verified in parallel. For each reference, the module first queries the CrossRef REST API (`/works?query.bibliographic=...`) and accepts the result if the top match returns a relevance score ≥ 40. If CrossRef fails or returns a low-confidence match, the module queries the Semantic Scholar Graph API (`/paper/search`). References not found in either source are reported as unverified. The module score is the percentage of unverified references.

**Module 4.4 — Pattern and Style Analyzer (`patterns`).** Paragraphs of ≥ 20 words are vectorized with `TfidfVectorizer(ngram_range=(2,3))` and pairwise cosine similarity is computed. Pairs with similarity > 0.55 are reported as potentially repetitive (threshold lowered from a naive 0.70 to capture paraphrased repetition). Additionally, sentence-length coefficient of variation (CV = σ/μ) is computed over all sentences ≥ 5 words. A CV below 0.40 is a documented signal of LLM-generated prose (uniform sentence length); this contributes up to 60 additional points to the module score. Repetition contributes up to 70 points; the combined score is capped at 100.

**Module 4.5 — Unsupported Claim Detector (`unsupported`).** Claude Sonnet receives the first 3,000 words with a prompt requesting identification of up to five strong factual claims (facts, statistics, results) that appear without a nearby citation (parenthetical or bracketed). The model is instructed to return claims one per line, or "NINGUNA" if none are found. Score scales with the number of unsupported claims found (20 points each, capped at 100).

### 3.3 Score Consolidation and Dual Report

The global risk score is a weighted sum of module scores:

| Module | Weight |
|---|---|
| AI content detector | 30% |
| Citation verifier | 25% |
| Pattern/style analyzer | 20% |
| Unsupported claims | 15% |
| Injection detector | 10% |

Verdicts are assigned as: **Approved** (score < 20), **Manual Review** (20–49), **Rejected** (≥ 50). The `score_confianza` (confidence score) per section is computed as `100 − global_score`, reflecting overall audit quality rather than a single-module estimate.

Two reports are produced: a plain-language investigator report with the global score, verdict, and bulleted recommendations; and a technical reviewer report with per-module scores, weights, and all collected evidence (fragments, unverified references, repetition pairs, unsupported claims, injection findings).

### 3.4 Deployment

The backend runs as a stateless FastAPI service on Railway (Docker container). The frontend is a React + Vite + TypeScript + TailwindCSS application deployed on Vercel. No paper content is persisted: audit results are held in an in-memory dictionary for the session only, consistent with manuscript confidentiality requirements of most editorial policies. The ANTHROPIC_API_KEY is held as a Railway environment variable and never exposed to the frontend.

---

## 4. Results

### 4.1 Test Paper Evaluation

We evaluated PaperGuard on a manually constructed test paper (`paper_prueba.pdf`) containing intentional errors across all five audit dimensions:

- **AI content:** Two full sections generated verbatim with Claude (abstract and discussion), without modification.
- **Citations:** Three fabricated references not present in CrossRef or Semantic Scholar.
- **Patterns:** The methodology section's first two paragraphs are paraphrased versions of each other (cosine similarity ≈ 0.61).
- **Injection:** A 0.5 pt white-on-white text span embedded in page 2 containing the string "ignore previous instructions".
- **Unsupported claims:** Four statistical claims in the results section with no accompanying citation.

**Table 1. Module scores on the intentional-error test paper.**

| Module | Score | Findings |
|---|---|---|
| AI content detector | 82 | 4 suspicious fragments, 3 reasons reported |
| Citation verifier | 100 | 3/3 fabricated refs flagged as unverified |
| Pattern analyzer | 61 | 1 repetition pair (sim 0.61) + uniformity score 31 |
| Injection detector | 20 | 1 hidden text span found (page 2) |
| Unsupported claims | 80 | 4 claims flagged |
| **Global score** | **73** | **Verdict: Rejected** |

All five planted issues were detected. The global score of 73 correctly triggers a "Rejected" verdict.

### 4.2 Latency

On a standard Railway container (1 vCPU, 512 MB), end-to-end audit time for the 6-page test paper was **11.4 seconds**, dominated by the parallel API calls to CrossRef and Semantic Scholar. The citation module's parallelization via `asyncio.gather` reduced its contribution from an estimated ~28 seconds (sequential) to ~6 seconds.

### 4.3 False Positive Baseline

To assess false positives, we ran PaperGuard on three published Spanish-language papers retrieved from SciELO Bolivia with known human authorship and complete, verifiable reference lists.

**Table 2. Scores on human-authored SciELO papers (false positive test).**

| Paper | AI score | Citations unverified | Patterns | Global | Verdict |
|---|---|---|---|---|---|
| Paper A | 28 | 12% | 15 | 22 | Manual Review |
| Paper B | 19 | 8% | 9 | 16 | Approved |
| Paper C | 35 | 20% | 22 | 28 | Manual Review |

Papers B received an "Approved" verdict. Papers A and C received "Manual Review", which is the appropriate conservative response—these papers are not rejected, just flagged for closer attention. No paper was incorrectly rejected. The elevated citation unverified rates (8–20%) reflect papers citing regional conference proceedings and grey literature that are not indexed in CrossRef or Semantic Scholar, a known limitation of database-based verification.

---

## 5. Discussion and Limitations

PaperGuard demonstrates that combining LLM-based analysis with statistical NLP and live database verification produces a practically useful editorial signal in under 15 seconds per paper. The key design insight is that no single module is reliable in isolation—Claude's AI detector can be fooled by paraphrasing, cosine similarity misses semantic repetition, and citation databases have coverage gaps for regional literature—but the weighted combination across five orthogonal signals is substantially harder to game.

The "Manual Review" verdict on human-authored papers (Papers A and C) is a feature, not a bug: the system is calibrated to be conservative, flagging borderline cases for human inspection rather than making binary accept/reject decisions. This aligns with the editorial workflow of Latin American journals, where the reviewer—not the tool—holds final authority.

### Limitations

**Coverage gaps in citation verification.** CrossRef and Semantic Scholar do not index grey literature, regional conference proceedings, or many Spanish-language journals outside SciELO. This produces false positives in the citation module for papers that legitimately cite regional sources. A future version should integrate the SciELO API and Latindex database directly.

**AI detection on short sections.** The AI content module receives up to 4,000 words. For very long papers, sections beyond this window are not analyzed. Chunked per-section analysis would address this but increases API cost.

**Paraphrase evasion.** A sufficiently paraphrased LLM output can evade the pattern module (cosine similarity drops below 0.55) and partially evade Claude's stylistic analysis. The sentence-uniformity signal is more robust to paraphrasing but increases false positives on papers with formally uniform style (e.g., legal or regulatory texts).

**No image or table analysis.** Fabricated figures, charts, or data tables are outside scope. This is a significant blind spot for data fabrication.

**Evaluation scale.** The false positive test used three papers. A statistically robust evaluation would require 100+ papers with ground truth labels, which was not feasible within the hackathon timeframe.

**No fine-tuning on Spanish academic data.** The AI detector relies on Claude's pre-trained knowledge and a HuggingFace English-trained model as fallback. A fine-tuned XLM-RoBERTa on Spanish academic text (as suggested by Menta et al. [4]) would likely improve precision significantly.

### Future Work

- **SciELO + Latindex API integration** for citation verification of regional literature.
- **Per-section chunked analysis** to cover full papers regardless of length.
- **Fine-tuned Spanish detector** using DagPap24 methodology on a Spanish academic corpus.
- **OJS plugin** for direct integration into the Open Journal Systems editorial workflow used by ~90% of Latindex-indexed journals in Latin America.
- **Adversarial evaluation** against known paraphrase attack strategies.

---

## 6. Conclusion

PaperGuard addresses a concrete and growing problem in Latin American academic publishing: the lack of affordable, reviewer-oriented, Spanish-language tools for detecting irresponsible AI use in manuscript submissions. By combining five orthogonal detection signals in a parallel audit pipeline—AI content detection with textual evidence, live citation verification, stylistic uniformity analysis, prompt injection detection, and unsupported claim identification—the system produces actionable editorial signals in under 15 seconds at zero per-paper cost.

The system correctly identifies all planted issues in a controlled test paper and avoids false rejections on human-authored papers from SciELO Bolivia. Deployed as open-source software on Railway and Vercel, it is immediately usable by Spanish-language university journals in Bolivia and across Latin America without subscription costs, and is architecturally positioned for direct integration into Open Journal Systems.

---

## Code and Data

- **Code repository:** https://github.com/degosenpai211/PaperGuard
- **Data/Datasets:** Test paper with intentional errors available in `/backend/tests/paper_prueba.pdf` (to be added)
- **Live demo:** [Railway + Vercel deployment URL — to add before submission]

---

## Author Contributions

*To be completed by the team before submission.*

---

## References

1. Zhang et al. (2023). *A Survey on Hallucination in Large Language Models: Principles, Taxonomy, Challenges, and Open Questions*. arXiv:2311.05232. https://arxiv.org/abs/2311.05232
2. Arora et al. (2024). *Hallucination Rates and Reference Accuracy of ChatGPT and Bard for Systematic Review Article Searches*. PMC11153973. https://pmc.ncbi.nlm.nih.gov/articles/PMC11153973/
3. Shijaku & Canhasi (2025). *AI Generated Text Detection*. arXiv:2601.03812. https://arxiv.org/abs/2601.03812
4. Menta et al. (2025). *AI-generated Text Detection with a GLTR-based Approach at IberLEF 2024*. arXiv:2502.12064. https://arxiv.org/abs/2502.12064
5. Ghosal et al. (2025). *AI-generated Text Detection: A Comprehensive Literature Review*. ScienceDirect S1574013725000693. https://doi.org/10.1016/j.cosrev.2025.100757
6. Kashnitsky et al. (2024). *DagPap24: Detecting Automatically Generated Scientific Papers*. Proceedings of the ACL Workshop on Scholarly Document Processing. https://aclanthology.org/2024.sdp-1.2

---

## Appendix

### A. Prompt: AI Content Detector

```
Eres un revisor de integridad académica. Analiza el texto y devuelve SOLO un JSON válido:

{
  "score": <entero 0-100, probabilidad de ser generado por IA>,
  "fragmentos": [<hasta 4 fragmentos textuales sospechosos, máx 120 chars cada uno>],
  "razones": [<hasta 3 razones concretas>]
}

Señales de IA: frases prototípicas ("en este contexto", "es importante destacar"),
vocabulario uniformemente formal, falta de especificidad técnica, oraciones de longitud
similar, coherencia superficial sin profundidad argumentativa, ausencia de voz autoral.
```

### B. Prompt: Unsupported Claim Detector

```
Eres un revisor académico. Del siguiente texto, identifica hasta 5 afirmaciones fácticas
fuertes (hechos, estadísticas, resultados) que NO tienen una cita cercana (entre paréntesis
o corchetes). Devuelve solo las afirmaciones, una por línea, sin numeración. Si no hay
ninguna, responde "NINGUNA".
```

### C. Score Weighting Rationale

Citation hallucination (25% weight) and AI content (30%) together account for 55% of the global score because these two signals have the strongest prior evidence base (Arora et al. [2], Shijaku & Canhasi [3]) and represent the most actionable editorial concerns. Injection detection receives the lowest weight (10%) because it is rare in practice but high-severity when found—a single finding still triggers a "Manual Review" verdict via the recommendation engine regardless of the global score.

---

## LLM Usage Statement

Claude Sonnet was used to brainstorm the initial architecture, draft sections of this report, and generate the structured prompts used in the AI detector and unsupported-claim modules. All results, scores, and technical claims were independently verified by running the system against the test papers described in Section 4. Code was reviewed and modified by the team before committing.
