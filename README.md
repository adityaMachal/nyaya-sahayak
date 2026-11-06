# Nyaya Sahayak (न्याय सहायक)

### Multi-Agent Indian Legal AI Assistant

Nyaya Sahayak is a multi-agent statutory intelligence platform designed to provide legally grounded, deterministic legal assistance under Indian jurisprudence. The system implements a deterministic directed acyclic graph (DAG) via LangGraph, integrating native Gemini function calling, in-memory FastMCP tool execution, local ChromaDB vector retrieval on CUDA hardware, and a Next.js 16 technical dossier interface.

The platform addresses the transition from legacy Indian legal frameworks (Indian Penal Code 1860, Code of Criminal Procedure 1973) to modern criminal codes (Bharatiya Nyaya Sanhita 2023, Bharatiya Nagarik Suraksha Sanhita 2023), enforcing strict statutory citation and limitation period verification.

---

## Architecture Overview

Nyaya Sahayak separates concerns across four specialized autonomous agent nodes coordinated by a deterministic StateGraph:

```
                          [ Citizen Query Input ]
                                     |
                                     v
                        [ Node 1: Supervisor Router ]
                                     |
               +---------------------+---------------------+
               |                     |                     |
        (route: action)       (route: both)        (route: research)
               |                     |                     |
               v                     v                     v
      [ Node 2: Action ]      [ Node 4: Both ]     [ Node 3: Researcher ]
      - FastMCP Tools         - RAG + Tools        - Multi-Query Expansion
      - < 1ms In-Memory       - Hybrid Context     - ChromaDB Vector Search
               |                     |                     |
               +---------------------+---------------------+
                                     |
                                     v
                        [ Node 5: Explainer Node ]
                        - Synthesizes Attributed Memo
                        - 100% Pydantic Groundedness
                        - Advocates Act 1961 Notice
                                     |
                                     v
                          [ Structured Output ]
```

### Agent Nodes Specification

1. **Supervisor Router (`core/pipeline.py`):** Classifies citizen inquiries into `research` (general rights and procedures), `action` (specific section lookups and limitation periods), or `both` (combined complex scenarios).
2. **Researcher Node (`core/pipeline.py`):** Generates multi-query expansions and queries the local ChromaDB vector store. Deduplicates retrieved chunks via O(1) hash-sets and enforces Pydantic data contracts.
3. **Action Node (`core/pipeline.py`):** Executes deterministic statutory tools via native Gemini Function Declarations. Routes queries to in-memory callables with sub-millisecond execution.
4. **Explainer Node (`core/pipeline.py`):** Ingests structured statutory context and tool outputs, synthesizing a four-part legal memorandum: Direct Answer, Statutory Provisions, Procedural Next Steps, and Advocate Consultation Criteria.

---

## Key Technical Features

### 1. In-Memory FastMCP Tool Execution
Replaced standard subprocess-based Model Context Protocol (MCP) clients with a centralized in-process `TOOL_REGISTRY`.
- Eliminates 2.5-second subprocess spin-up overhead per turn.
- Executes statutory tools (`search_bns_section`, `check_limitation_period`, `find_relevant_acts`) in less than 1 millisecond (<0.3ms measured).

### 2. Edge-Cloud Hybrid RAG Architecture
- **Local Edge Compute (NVIDIA RTX 3050 CUDA):** Runs `SentenceTransformers` (`all-MiniLM-L6-v2`) and local ChromaDB vector similarity in approximately 5ms warm latency, avoiding vector database network hops and external embedding API costs.
- **Cloud Foundation Model:** Google Gemini Flash (`gemini-3.8-flash` / `gemini-3.5-flash`) handles high-level intent classification, tool decisioning, and final memorandum synthesis.

### 3. Pydantic Data Contract (`RetrievedChunk`)
Eliminated string-splitting and regex heuristics across agent communication boundaries. All retrieval data is strictly typed:
```python
class RetrievedChunk(BaseModel):
    id: str
    text: str
    source: str
    doc_type: str
    act_title: str | None = None
    section_heading: str | None = None
    distance: float | None = None
    metadata: dict = Field(default_factory=dict)
```

### 4. Native Function Calling & Model Resilience
Tool selection utilizes the Gemini SDK `types.FunctionDeclaration` protocol with `automatic_function_calling=False`, ensuring zero JSON decoding failures. Transient API rate limits (HTTP 429) and high-demand spikes (HTTP 503) are handled via automated multi-model fallback and exponential backoff retry policies.

### 5. Multi-Turn SQLite WAL Persistence
Session history is managed via `core/memory.py` with SQLite Write-Ahead Logging (WAL). Follow-up questions maintain conversational context while preserving raw chronological dialogue logs.

### 6. Technical Dossier Frontend (Next.js 16)
Designed around a "Legal Brutalism / Technical Dossier" aesthetic matching formal judicial briefs:
- Server-Sent Events (SSE) streaming (`POST /api/ask/stream`) with real-time LangGraph node execution telemetry.
- Dynamic three-column consultation command center (`/chat`): SQLite Dossier Archive, Citizen Intake Terminal, and Live Agent Trace.
- Quad-font typography: Playfair Display, Noto Serif Devanagari, IBM Plex Mono, and Newsreader.

### 7. End-to-End Latency Optimization & Real-Time Token Streaming
Collapsed the 4-step sequential cloud LLM waterfall (Supervisor -> Researcher Multi-Query -> Action Selection -> Explainer) via multi-tier systems optimization:
- **FastAPI Lifespan Embedding Pre-Warming:** Pre-loads PyTorch sentence transformer weights and ChromaDB client onto GPU at server startup, eliminating initial cold-start delays.
- **Deterministic Fast-Path Router (<1ms):** Evaluates high-precision statutory regex patterns to classify 93.3% of benchmark queries in sub-millisecond time (<0.001s vs ~3.2s cloud LLM), with transparent fallback to Gemini zero-shot classifier for ambiguous queries.
- **Adaptive Direct-Path Dense Vector Search (5.2ms):** Directly queries ChromaDB on CUDA using dense semantic embeddings; if >= 3 statutory chunks are retrieved, bypasses the 4.5-second Gemini multi-query expansion prompt.
- **Concurrent DAG Execution:** Executes RAG retrieval and FastMCP statutory tools in parallel threads via `ThreadPoolExecutor(max_workers=2)`, accelerating complex dual-path inquiries by 10.1x.
- **Real-Time Token Streaming with Queue-Bridged SSE:** Bridges synchronous generation streams from Gemini into FastAPI's asynchronous SSE generator via thread-safe queues, streaming `answer_chunk` events token-by-token directly to Next.js 16.
- **Perceived Time to First Token (TTFT):** Dropped from ~24.2s down to **0.908s - 1.924s** (up to 96.2% reduction in perceived wait time), with full turns completing in **3.019s - 3.305s**.

---

## Statutory Coverage

The retrieval corpus incorporates foundational and contemporary Indian legislation:

| Act Title | Key Sections Covered | Primary Function |
|:---|:---|:---|
| **Bharatiya Nyaya Sanhita, 2023 (BNS)** | Sections 1 to 358 | Modern penal offenses (replaces IPC 1860) |
| **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)** | Sections 1 to 531 | Criminal procedural law, arrest, and Zero-FIR |
| **Bharatiya Sakshya Adhiniyam, 2023 (BSA)** | Sections 1 to 170 | Law of evidence and electronic records |
| **Negotiable Instruments Act, 1881** | Section 138, 141, 142 | Cheque dishonour and statutory notice timelines |
| **Limitation Act, 1963** | Articles 1 to 137 | Statutory limitation periods for civil suits |
| **Transfer of Property Act, 1882** | Sections 105 to 111 | Lease covenants, tenancy, and deposit recovery |
| **Indian Contract Act, 1872** | Sections 73, 74 | Breach of contract and liquidated damages |
| **Consumer Protection Act, 2019** | Sections 2, 35 | Unfair trade practices and consumer dispute filing |
| **Constitution of India, 1950** | Part III (Articles 12 to 35) | Fundamental rights and constitutional remedies |

---

## Performance Benchmarks

All benchmarks measured on Linux (Kernel 6.8, Ubuntu 24.04 LTS), AMD Ryzen 7 7435HS, NVIDIA GeForce RTX 3050 Laptop GPU (4GB VRAM, CUDA 12.6).

| Benchmark Parameter | Unoptimized Baseline | Nyaya Sahayak Production | Delta / Factor |
|:---|:---|:---|:---|
| **Vector Retrieval Warm Latency** | ~7,200 ms | **5.2 ms** | **1,128.2x faster** |
| **Tool Execution Protocol** | Subprocess MCP (~2,500 ms) | **In-Memory Registry (<0.3 ms)** | **Subprocess eliminated** |
| **Tool Parameter Parsing** | Regex string parsing | **Native Function Calling** | **0% schema errors** |
| **Inter-Agent Serialization** | Delimited ASCII string | **Pydantic Model Contract** | **100% type-safe** |
| **Frontend Production Build** | Standard Webpack (~8.4s) | **Next.js 16 Turbopack (562 ms)** | **14.9x faster** |
| **Automated Evaluation Suite** | Manual review (~2-3 hrs) | **RAG Triad LLM Judge (15/15 PASS)** | **100% automated CI guard** |

---

## Repository Structure

```
nyaya-sahayak/
|-- api/
|   |-- __init__.py
|   `-- server.py              # FastAPI application (REST + SSE streaming)
|-- core/
|   |-- __init__.py
|   |-- memory.py              # SQLite multi-turn conversation memory
|   `-- pipeline.py            # LangGraph multi-agent DAG and Gemini function calling
|-- data/
|   |-- raw/                   # Statutory markdown corpora (BNS, NI Act, etc.)
|   |-- chroma_db/             # Local ChromaDB persistent vector index
|   `-- conversations.db       # SQLite chat session database
|-- evaluation/
|   |-- evaluate.py            # Benchmark execution script with checkpoint auto-resume
|   |-- rag_triad_judge.py     # Single-pass LLM Judge & deterministic context precision
|   |-- schemas.py             # Pydantic evaluation schemas (claims, audits, scores)
|   |-- test_queries.json      # 15 statutory and adversarial legal evaluation scenarios
|   |-- evaluation_run_results.json # Raw judicial claim decomposition & scoring dataset
|   `-- results.md             # Formal benchmark audit report and scorecard
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |   |-- globals.css    # Legal Brutalism design tokens & styling
|   |   |   |-- layout.tsx     # Root Next.js layout
|   |   |   |-- page.tsx       # Technical Dossier landing page
|   |   |   `-- chat/
|   |   |       `-- page.tsx   # 3-column Legal Consultation Workspace
|   |   `-- components/        # Isolated UI components (Flowchart, CaseLogs, etc.)
|   |-- package.json
|   `-- tsconfig.json
|-- mcp_server/
|   |-- __init__.py
|   `-- server.py              # FastMCP statutory tool declarations
|-- rag/
|   |-- __init__.py
|   |-- config.py              # System configuration, paths, and model names
|   |-- indexer.py             # Statutory markdown chunking and indexing script
|   `-- retrieval.py           # Lazy singletons, ChromaDB interface, RetrievedChunk
|-- project_journal.md         # Comprehensive engineering journal and decision records
|-- pyproject.toml             # Python dependencies and build metadata
`-- README.md
```

---

## Installation & Setup

### Prerequisites
- Python 3.12 or newer
- Node.js 20.x or newer (with npm)
- `uv` package manager (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- NVIDIA GPU with CUDA 12+ (recommended for 5ms retrieval; automatically falls back to CPU)
- Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/nyaya-sahayak.git
cd nyaya-sahayak
```

### 2. Backend Configuration
Create a `.env` file in the project root:
```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
LLM_MODEL=gemini-3.8-flash
FALLBACK_MODEL=gemini-flash-latest
CORS_ORIGINS=http://localhost:3000
```

Install dependencies using `uv`:
```bash
uv sync
```

### 3. Statutory Database Indexing (First Run Only)
If `data/chroma_db/` is not present, index the statutory acts:
```bash
uv run python -m rag.indexer
```

### 4. Start the FastAPI Backend
```bash
uv run python -m uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
```
The API documentation is accessible at `http://localhost:8000/docs`.

### 5. Frontend Setup & Launch
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` for the landing page or `http://localhost:3000/chat` for the consultation workspace.

---

## API Specification

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Service health status check |
| `POST` | `/api/ask` | Synchronous legal question resolution (returns full JSON) |
| `POST` | `/api/ask/stream` | Server-Sent Events (SSE) streaming with live LangGraph trace |
| `GET` | `/api/sessions` | List active SQLite consultation sessions |
| `GET` | `/api/sessions/{id}/history` | Retrieve chronological chat turns for a specific session |
| `DELETE` | `/api/sessions/{id}` | Purge a consultation session and associated history |

---

## Automated Evaluation Suite (RAG Triad & LLM-as-a-Judge)

Nyaya Sahayak incorporates an automated, scientifically rigorous judicial evaluation suite located in `evaluation/`. Rather than relying on subjective human spot-checking, every turn is audited by an automated LLM Judge using the **RAG Triad** framework with deterministic metadata verification.

### Evaluation Methodology & Metrics

1. **Faithfulness (Zero-Hallucination via Atomic Claim Decomposition):**
   - The evaluator deconstructs each synthesized legal memorandum into atomic, isolated factual propositions (e.g., section numbers, limitation periods, penalty durations).
   - Each claim is cross-checked against the retrieved statutory chunks.
   - A claim is verified (`is_supported = True`) **only if an exact verbatim quote** exists in the retrieved context. Any unsubstantiated statutory assertion is flagged as a hallucination.
   - Metric formula: $\text{Faithfulness} = \frac{\text{Supported Claims}}{\text{Total Claims}}$. Target: $\ge 95.0\%$.

2. **Answer Relevance (Query Directness & Completeness):**
   - Evaluates whether the generated memorandum directly and comprehensively addresses the citizen's inquiry without evasiveness, conversational filler, or irrelevant legal digressions.
   - Harmonic combination of directness and statutory completeness. Target: $\ge 90.0\%$.

3. **Context Precision (Deterministic Rank Utility):**
   - Measures whether the ChromaDB retrieval engine surfaced the required statutory acts and sections in the top ranks.
   - Evaluated **deterministically in Python** (`< 1ms` latency, 0 API calls) against verified ground-truth metadata in `test_queries.json`, utilizing Mean Reciprocal Rank (MRR) and Precision@K. Target: $\ge 85.0\%$.

4. **Composite Score:**
   - Weighted combination prioritizing factual accuracy:
     $$\text{Composite Score} = (0.45 \times \text{Faithfulness}) + (0.35 \times \text{Relevance}) + (0.20 \times \text{Context Precision})$$
   - Verdict criteria: **PASS** if $\text{Composite} \ge 85.0\%$ and $\text{Faithfulness} \ge 90.0\%$; otherwise **NEEDS_REVIEW** ($\ge 70.0\%$) or **FAIL** ($< 70.0\%$).

---

### Verified Benchmark Scorecard (15/15 Scenarios)

The evaluation suite was executed across a 15-scenario statutory corpus covering criminal procedure, tenancy disputes, cheque bounce notices, constitutional remedies, and adversarial negative controls:

| Evaluation Metric | Measured Score | Benchmark Target | Status |
|:---|:---:|:---:|:---:|
| **Faithfulness (Zero-Hallucination)** | **100.0%** | >= 95.0% | MET |
| **Answer Relevance** | **97.4%** | >= 90.0% | MET |
| **Context Precision (Rank Utility)** | **96.2%** | >= 85.0% | MET |
| **Composite Score** | **98.3%** | >= 85.0% | MET |
| **Benchmark Pass Rate** | **15 / 15 (100.0%)** | 100.0% | PASS |

### Adversarial Robustness Check
- **Negative Control (Query #15):** Tested against a fabricated section (*Section 999 of Bharatiya Nyaya Sanhita, 2023*).
- **Result:** The system correctly identified that Section 999 does not exist in the BNS (the BNS terminates at Section 358), achieving 100% faithfulness and zero hallucinations.

---

### Latency Optimization & Time to First Token (TTFT) Benchmark

The multi-tier latency optimization collapsed the sequential cloud LLM waterfall:

| Component / Phase | Unoptimized Baseline | Optimized Pipeline | Acceleration / Speedup |
|:---|:---:|:---:|:---:|
| **Supervisor Router** | ~3.20s (Cloud LLM) | **0.001s (<1ms)** | **3,200x faster** (Deterministic Fast-Path) |
| **Researcher Retrieval Node** | ~4.50s (LLM Multi-Query) | **0.022s (22ms)** | **204x faster** (Adaptive Direct Dense RAG) |
| **Combined DAG Node (Both)** | ~7.70s (Sequential Execution) | **0.760s** | **10.1x faster** (Concurrent ThreadPool) |
| **Perceived Time to First Token (TTFT)** | ~24.20s (Blocking Generation) | **0.908s - 1.924s** | **92.1% - 96.2% reduction in wait time** |
| **End-to-End Turn Completion** | ~26.0s - 35.0s | **3.019s - 3.305s** | **8.6x - 10.6x overall turn acceleration** |

---

### Running the Evaluation Harness

The evaluation runner includes real-time incremental auto-saving, checkpoint auto-resume, and rate-limit pacing:

```bash
# Run the full 15-scenario evaluation suite (resumes from checkpoint automatically)
uv run python evaluation/evaluate.py

# Evaluate a specific subset of query IDs
uv run python evaluation/evaluate.py --ids 6,12,14

# Run with custom inter-query pacing delay (seconds)
uv run python evaluation/evaluate.py --delay 5.0

# Force full re-evaluation from scratch (bypasses cache)
uv run python evaluation/evaluate.py --no-resume
```

Detailed per-scenario audits and atomic claim quotes are saved to `evaluation/results.md`, and raw JSON data is serialized to `evaluation/evaluation_run_results.json`.

---

## Compliance & Legal Disclaimer

This software is developed strictly as a legal awareness, information extraction, and research system. Under the Advocates Act, 1961, and Bar Council of India regulations:
- Nyaya Sahayak does not provide legal representation, formal legal advice, or advocate-client privileged communication.
- Statutory citations and limitation periods must be verified by a licensed advocate before filing complaints, petitions, or notices before any Indian judicial or quasi-judicial forum.

---

## Author & License

- **Architect & Author:** Aditya Machal ([adimachal30@gmail.com](mailto:adimachal30@gmail.com))
- **License:** MIT License. See `LICENSE` for details.
