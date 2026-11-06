# Automated RAG Triad Evaluation Report — Nyaya Sahayak

**Run Date:** 2026-11-06 08:20:32  
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
| 1 | constitution | What are the fundamental rights guaranteed... | `research` | 3 | 100.0% | 95.0% | 100.0% | **98.2%** | **PASS** |
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

### Query #6: How do I file an RTI application and what is the fee?
- **Verdict:** PASS (Composite Score: 1.0)
- **Total Claims Extracted:** 12 | **Supported Claims:** 12

| Claim # | Factual Claim in Memorandum | Supported? | Verbatim Statutory Evidence Quote |
|:---:|:---|:---:|:---|
| 1 | You can submit your request in writing or electronically in English, Hindi, or the official language of your area to the appropriate Public Information Officer. | [SUPPORTED] | "A person who desires to obtain any information under this Act shall make a request in writ..." |
| 2 | The standard application fee is ₹10. | [SUPPORTED] | "The application should be accompanied by a fee of ten rupees (₹10) prescribed by the appro..." |
| 3 | If you belong to the Below Poverty Line (BPL) category, you are completely exempt from paying this fee as long as you attach a copy of your BPL certificate or card. | [SUPPORTED] | "For BPL (Below Poverty Line) applicants, no fee is required, provided a copy of the BPL ca..." |
| 4 | You do not need to give any reasons for asking for the information—just specify clearly what details you are looking for. | [SUPPORTED] | "The applicant is not required to give any reason for requesting the information or any oth..." |

### Query #7: What are a tenant's rights against illegal eviction?
- **Verdict:** PASS (Composite Score: 0.958)
- **Total Claims Extracted:** 7 | **Supported Claims:** 7

| Claim # | Factual Claim in Memorandum | Supported? | Verbatim Statutory Evidence Quote |
|:---:|:---|:---:|:---|
| 1 | Tenancy laws in India are state-specific under various Rent Control Acts, but general principles protect tenants from arbitrary and forceful eviction. | [SUPPORTED] | "Tenancy law in India is primarily state-specific, with each state having its own Rent Cont..." |
| 2 | A landlord cannot legally throw out a tenant by force and can only evict through due process of law via a competent court or Rent Controller on specific legal grounds. | [SUPPORTED] | "a landlord cannot evict a tenant except through due process of law and on grounds recogniz..." |
| 3 | Landlords cannot cut off essential services like electricity, water, or sanitation to force a tenant to vacate. | [SUPPORTED] | "Tenants have the right to essential services such as water, electricity, and sanitation, a..." |
| 4 | Tenants are legally entitled to a receipt for the rent they pay, which serves as proof against false claims of non-payment. | [SUPPORTED] | "A tenant is entitled to a receipt for rent paid to the landlord. This receipt serves as ev..." |

### Query #8: What is the limitation period for filing a consumer complaint?
- **Verdict:** PASS (Composite Score: 1.0)
- **Total Claims Extracted:** 3 | **Supported Claims:** 3

| Claim # | Factual Claim in Memorandum | Supported? | Verbatim Statutory Evidence Quote |
|:---:|:---|:---:|:---|
| 1 | The limitation period for filing a consumer complaint is 2 years from the date on which the cause of action arose. | [SUPPORTED] | "Section 69 of the Consumer Protection Act, 2019 specifies a 2-year limitation period from ..." |
| 2 | A Consumer Commission will not admit a complaint unless it is filed within 2 years from the date on which the cause of action has arisen. | [SUPPORTED] | "The District Commission, State Commission or National Commission shall not admit a complai..." |
| 3 | Delay beyond 2 years may be condoned if the complainant satisfies the Commission that there was sufficient cause for not filing within the period. | [SUPPORTED] | "Notwithstanding anything contained in sub-section (1), a complaint may be entertained afte..." |

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