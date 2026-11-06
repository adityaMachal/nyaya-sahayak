# Automated RAG Triad Evaluation Report — Nyaya Sahayak

**Run Date:** 2026-11-06 10:02:41  
**Evaluator Model:** Gemini Flash (Deterministic temperature=0.0)  
**Hardware Accelerated Retrieval:** NVIDIA GeForce RTX 3050 Laptop GPU (CUDA 12.6)  
**Corpus Coverage:** BNS 2023, BNSS 2023, NI Act 1881, Transfer of Property, Contract Act, Constitution of India  

---

## 1. Executive Summary & Aggregate Scorecard

| Evaluation Metric | Measured Score | Benchmark Target | Status |
|:---|:---:|:---:|:---:|
| **Faithfulness (Zero-Hallucination)** | **100.0%** | >= 95.0% | MET |
| **Answer Relevance** | **97.4%** | >= 90.0% | MET |
| **Context Precision (Rank Utility)** | **96.2%** | >= 85.0% | MET |
| **Composite Score** | **98.3%** | >= 85.0% | MET |
| **Benchmark Pass Rate** | **15 / 15 (100.0%)** | 100.0% | PASS |

---

## 2. Detailed Per-Query Judicial Audit

| # | Category | Question | Route | Chunks | Faithfulness | Relevance | Precision | Composite | Verdict |
|:---|:---|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | constitution | What are the fundamental rights guaranteed... | `research` | 5 | 100.0% | 95.0% | 100.0% | **98.2%** | **PASS** |
| 2 | ipc_bns | What is Section 302 of the IPC and what is... | `action` | 0 | 100.0% | 100.0% | 100.0% | **100.0%** | **PASS** |
| 3 | consumer | How do I file a consumer complaint online? | `research` | 8 | 100.0% | 98.0% | 82.5% | **95.8%** | **PASS** |
| 4 | family | What are the grounds for divorce under Hin... | `research` | 5 | 100.0% | 100.0% | 100.0% | **100.0%** | **PASS** |
| 5 | ipc_bns | What is the punishment for cybercrime in I... | `research` | 4 | 100.0% | 95.0% | 82.5% | **94.8%** | **PASS** |
| 6 | rti | How do I file an RTI application and what ... | `research` | 7 | 100.0% | 100.0% | 100.0% | **100.0%** | **PASS** |
| 7 | property | What are a tenant's rights against illegal... | `research` | 4 | 100.0% | 98.0% | 82.5% | **95.8%** | **PASS** |
| 8 | consumer | What is the limitation period for filing a... | `action` | 0 | 100.0% | 100.0% | 100.0% | **100.0%** | **PASS** |
| 9 | labor | Can an employer terminate an employee with... | `research` | 4 | 100.0% | 98.0% | 100.0% | **99.3%** | **PASS** |
| 10 | motor_vehicle | What are the penalties for drunk driving u... | `action` | 0 | 100.0% | 97.0% | 100.0% | **99.0%** | **PASS** |
| 11 | special_acts | What is the strict statutory notice window... | `action` | 0 | 100.0% | 100.0% | 100.0% | **100.0%** | **PASS** |
| 12 | property | What legal remedies exist if a landlord wr... | `research` | 5 | 100.0% | 95.0% | 100.0% | **98.2%** | **PASS** |
| 13 | contract | What is the limitation period and remedy f... | `both` | 5 | 100.0% | 85.0% | 95.0% | **93.8%** | **PASS** |
| 14 | bnss_procedure | What should a citizen do if the police ref... | `research` | 4 | 100.0% | 100.0% | 100.0% | **100.0%** | **PASS** |
| 15 | adversarial_negative | What offense and punishment is specified u... | `action` | 0 | 100.0% | 100.0% | 100.0% | **100.0%** | **PASS** |

---

## 3. Sample Atomic Claim Audits & Evidence Verification

To guarantee zero hallucination, the LLM Judge deconstructs legal memorandums into atomic propositions and requires exact verbatim quotes from the retrieved ChromaDB chunks:

### Query #1: What are the fundamental rights guaranteed by the Indian Constitution?
- **Verdict:** PASS (Composite Score: 0.982)
- **Total Claims Extracted:** 5 | **Supported Claims:** 5

| Claim # | Factual Claim in Memorandum | Supported? | Verbatim Statutory Evidence Quote |
|:---:|:---|:---:|:---|
| 1 | Article 14 guarantees that the State cannot deny anyone equality before the law or equal protection of the laws. | [SUPPORTED] | "Article 14: Equality before law / The State shall not deny to any person equality before t..." |
| 2 | Article 19 grants citizens the freedom of speech and expression, to assemble peaceably and without arms, to form associations or unions, to move and reside freely anywhere in India, and to practice any profession, occupation, trade or business. | [SUPPORTED] | "Article 19: Protection of certain rights regarding freedom of speech, etc. / (1) All citiz..." |
| 3 | Article 13 ensures that laws in force that are inconsistent with or in derogation of fundamental rights are void to the extent of such inconsistency. | [SUPPORTED] | "Article 13: Laws inconsistent with or in derogation of the fundamental rights / All laws i..." |
| 4 | Article 51A outlines the fundamental duty of every citizen of India to abide by the Constitution and respect its ideals and institutions, the National Flag and the National Anthem. | [SUPPORTED] | "Article 51A: Fundamental duties / It shall be the duty of every citizen of India to abide ..." |

### Query #2: What is Section 302 of the IPC and what is its BNS equivalent?
- **Verdict:** PASS (Composite Score: 1.0)
- **Total Claims Extracted:** 5 | **Supported Claims:** 5

| Claim # | Factual Claim in Memorandum | Supported? | Verbatim Statutory Evidence Quote |
|:---:|:---|:---:|:---|
| 1 | Section 302 of the Indian Penal Code deals with the punishment for murder. | [SUPPORTED] | "TOOL-VERIFIED STATUTORY FACT..." |
| 2 | Under the old IPC, anyone found guilty of murder faced the death penalty or imprisonment for life, along with a fine. | [SUPPORTED] | "TOOL-VERIFIED STATUTORY FACT..." |
| 3 | The exact equivalent of the old IPC Section 302 is Section 101 of the Bharatiya Nyaya Sanhita (BNS). | [SUPPORTED] | "TOOL-VERIFIED STATUTORY FACT..." |
| 4 | Section 101 of the BNS carries the punishment of death or life imprisonment plus a fine. | [SUPPORTED] | "TOOL-VERIFIED STATUTORY FACT..." |

### Query #6: How do I file an RTI application and what is the fee?
- **Verdict:** PASS (Composite Score: 1.0)
- **Total Claims Extracted:** 12 | **Supported Claims:** 12

| Claim # | Factual Claim in Memorandum | Supported? | Verbatim Statutory Evidence Quote |
|:---:|:---|:---:|:---|
| 1 | You can submit your request in writing or electronically in English, Hindi, or the official language of your area to the appropriate Public Information Officer. | [SUPPORTED] | "A person who desires to obtain any information under this Act shall make a request in writ..." |
| 2 | The standard application fee is ₹10. | [SUPPORTED] | "The application should be accompanied by a fee of ten rupees (₹10) prescribed by the appro..." |
| 3 | If you belong to the Below Poverty Line (BPL) category, you are completely exempt from paying this fee as long as you attach a copy of your BPL certificate or card. | [SUPPORTED] | "For BPL (Below Poverty Line) applicants, no fee is required, provided a copy of the BPL ca..." |
| 4 | You do not need to give any reasons for asking for the information—just specify clearly what details you are looking for. | [SUPPORTED] | "The applicant is not required to give any reason for requesting the information or any oth..." |

---

## 4. Adversarial & Negative Control Analysis

Query #15 evaluated system robustness against a non-existent statutory section (*Section 999 of Bharatiya Nyaya Sanhita, 2023*):
- **Result:** The system correctly identified that Section 999 does not exist in the BNS (the BNS contains 358 sections).
- **Faithfulness Rating:** 100% (No fabricated legal rules or penalties were generated).

---

## 5. Architectural Comparison (Before vs. After Issue #6)

| Evaluation Parameter | Manual Review Baseline (Prior) | Automated RAG Triad Judge (Current) |
|:---|:---|:---|
| **Grading Methodology** | Subjective human inspection | Deterministic LLM Judge (temperature=0.0) |
| **Hallucination Detection** | Manual spot-checking | Atomic claim-by-claim verbatim quote matching |
| **Retrieval Quality Metric** | Simple binary hit rate | Rank-aware Context Precision & MRR |
| **Execution Duration** | 2-3 hours manual reading | ~2-3 minutes automated pipeline execution |
| **CI/CD Regression Guard** | Not possible | Fully automated with programmatic pass/fail exit codes |