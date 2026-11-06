# Nyaya Sahayak (न्याय सहायक) — Engineering Dev Journal & Architecture Log

> **Project:** Nyaya Sahayak — Multi-Agent Indian Legal AI Assistant  
> **Tech Stack:** Python 3.14, LangGraph, FastMCP, Google Gemini, ChromaDB, SentenceTransformers (CUDA), FastAPI, SQLite, Next.js 15, Tailwind CSS v4  
> **Repository:** `nyaya-sahayak`  
> **Developer:** Aditya Machal  

---

## 📖 Table of Contents
1. [Project Vision & Core Problem Statement](#1-project-vision--core-problem-statement)
2. [Architectural Decision Records (ADRs)](#2-architectural-decision-records-adrs)
3. [Chronological Engineering Log](#3-chronological-engineering-log)
   - [Phase 1: Environment Setup & Legal Data Acquisition](#phase-1-environment-setup--legal-data-acquisition)
   - [Phase 2: RAG Pipeline, Chunking & ChromaDB Ingestion](#phase-2-rag-pipeline-chunking--chromadb-ingestion)
   - [Phase 3: Semantic Retrieval Engine](#phase-3-semantic-retrieval-engine)
   - [Phase 4: Model Context Protocol (FastMCP) Server](#phase-4-model-context-protocol-fastmcp-server)
   - [Phase 5: LangGraph Multi-Agent Orchestration](#phase-5-langgraph-multi-agent-orchestration)
   - [Phase 6: Evaluation Suite & Benchmark Verification](#phase-6-evaluation-suite--benchmark-verification)
   - [Tier 1 Full-Stack: Modularization, SQLite Memory & FastAPI Backend](#tier-1-full-stack-modularization-sqlite-memory--fastapi-backend)
   - [Frontend: Next.js 15 & Indian Legal Themed Landing Page](#frontend-nextjs-15--indian-legal-themed-landing-page)
   - [Performance Optimization: Lazy Model Singletons (1,128× Speedup)](#performance-optimization-lazy-model-singletons-1128-speedup)
   - [Issue #2 Optimization: Direct Tool Registry & Gemini Resilience](#issue-2-optimization--model-upgrade-direct-tool-registry--gemini-38-flash)
   - [Issue #3 Architecture: Clean Pydantic Data Contracts for RAG](#issue-3-architecture-clean-pydantic-data-contracts-for-rag)
   - [Issue #4 Architecture: Native Gemini Tool Calling & Resilient Model Fallback](#issue-4-architecture-native-gemini-tool-calling--resilient-model-fallback)
   - [Issue #5 Architecture: Technical Dossier Landing Page & 3-Column Consultation Workspace (/chat)](#issue-5-architecture-technical-dossier-landing-page--3-column-consultation-workspace-chat)
   - [Issue #6 Architecture: Automated RAG Triad Evaluation & Gemini Quota Optimization](#issue-6-architecture-automated-rag-triad-evaluation-llm-as-a-judge--gemini-quota-optimization)
4. [Benchmark & Profiling History](#4-benchmark--profiling-history)
5. [Active Roadmap & Backlog](#5-active-roadmap--backlog)

---

## 1. Project Vision & Core Problem Statement

Indian law is characterized by colonial-era statutes (such as the Indian Penal Code of 1860, Indian Evidence Act of 1872) undergoing historic transformations into the **Bharatiya Nyaya Sanhita (BNS 2023)**, **Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)**, and **Bharatiya Sakshya Adhiniyam (BSA 2023)**. 

### Why General-Purpose LLMs Fail in Indian Law:
1. **Hallucination of Non-Existent Sections:** General LLMs frequently invent non-existent procedural codes or confuse state amendments.
2. **Jurisdiction Bleed:** LLMs regularly blend Indian constitutional or procedural principles with US/UK legal concepts (e.g., citing the "Fifth Amendment" or "Miranda rights").
3. **Statute Transition Lag:** LLMs struggle to reliably cross-reference historical IPC sections (e.g., IPC 302 vs. BNS 101 for murder, or IPC 420 vs. BNS 318 for cheating).
4. **Procedural Deadlines:** Statutory limitation periods (under the Limitation Act 1963) require deterministic, exact calculations, not probabilistic estimations.

### Engineering Solution:
A hybrid architecture combining **Retrieval-Augmented Generation (RAG)** over verified Indian statutes, **deterministic FastMCP tools** for statutory section mapping and limitation calculations, and a **LangGraph stateful multi-agent supervisor** that routes, retrieves, and synthesizes citizen-friendly legal explanations with mandatory disclaimers.

---

## 2. Architectural Decision Records (ADRs)

### ADR 001: Multi-Agent StateGraph (LangGraph) vs. Single-Prompt ReAct
- **Status:** Accepted
- **Context:** Standard ReAct loops with tools often get stuck or make unnecessary tool calls when answering conceptual questions (e.g., "What are my rights as a tenant?").
- **Decision:** Use a **LangGraph `StateGraph`** with a zero-shot **Supervisor Router**. The supervisor classifies incoming queries into `research` (RAG only), `action` (deterministic MCP lookups only), or `both` (combined) before routing to the **Explainer** synthesizer.
- **Consequence:** Eliminates redundant tool invocations, improves latency on pure conceptual questions, and isolates failure modes per agent node.

### ADR 002: Model Context Protocol (FastMCP) for Deterministic Tools
- **Status:** Accepted
- **Context:** High-stakes statutory data (IPC-to-BNS section mapping, limitation periods, legal definitions) should never rely on generative approximation.
- **Decision:** Build an external **FastMCP server** implementing JSON-RPC tools and resources (`search_bns_section`, `check_limitation_period`, `find_relevant_acts`, `legal://statistics`).
- **Consequence:** Clean decoupling between legal data services and LLM orchestration; tools can be shared across agents, IDEs, and other MCP clients.

### ADR 003: SQLite-Backed Multi-Turn Conversation Memory
- **Status:** Accepted
- **Context:** Stateless API calls prevent contextual follow-ups ("What is the punishment for this?").
- **Decision:** Implement [`core/memory.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/memory.py) using an SQLite database (`data/conversations.db`) with session isolation and prompt-friendly sliding-window formatting.
- **Consequence:** Enables persistent multi-turn conversations across CLI, REST, and SSE streaming sessions without requiring external Redis infrastructure for local development.

### ADR 004: Server-Sent Events (SSE) vs. WebSockets for Streaming
- **Status:** Accepted
- **Context:** Need to stream intermediate agent execution traces (Supervisor routing, RAG chunk count, MCP tool name) to the frontend UI.
- **Decision:** Use **Server-Sent Events (`POST /api/ask/stream`)** via FastAPI `StreamingResponse` and `sse-starlette`.
- **Consequence:** Simpler HTTP-compliant streaming with native reconnect support, no stateful WebSocket handshake overhead, and clean integration with Next.js `ReadableStream`.

---

## 3. Chronological Engineering Log

### Phase 1: Environment Setup & Legal Data Acquisition
- **Package Manager:** Standardized on `uv` (fast Python package manager) running Python 3.14.
- **Legal Datasets:** Collected and structured 9 core statutory domains into [`data/raw/`](file:///home/adi/Documents/projects/nyaya-sahayak/data/raw):
  1. `constitution.json` — Core Fundamental Rights (Articles 14, 19, 21, 32, 226)
  2. `ipc_bns_mapping.json` — Exhaustive mapping of historical IPC sections to new BNS 2023 equivalents
  3. `consumer_protection_act.md` — Consumer rights, forum jurisdictions, filing procedures (2019 Act)
  4. `rti_act_2005.md` — RTI application process, PIO obligations, appeal timelines
  5. `crpc_basics.md` — Arrest rights, bail provisions, FIR procedures
  6. `motor_vehicles_act.md` — Traffic violation penalties, MACT claims
  7. `industrial_disputes_act.md` — Wrongful termination, retrenchment compensation, wage recovery
  8. `hindu_marriage_act.md` — Divorce grounds, mutual consent cooling period, maintenance under S.125 CrPC
  9. `limitation_act.md` — Prescribed filing periods across civil and criminal matters

---

### Phase 2: RAG Pipeline, Chunking & ChromaDB Ingestion
- **Implementation:** [`rag/indexing.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/indexing.py), [`rag/config.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/config.py)
- **Chunking Strategy:**
  - *Markdown:* Semantic structural chunking by `##` headers with the top-level Act title prepended to maintain statutory context in each chunk.
  - *JSON:* Key-value normalization extracting section numbers, titles, penalties, and descriptions into structured text chunks.
- **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional embeddings) with automatic device selection (`cuda:0` on RTX 3050 with graceful CPU fallback).
- **Vector Store:** Local persistent **ChromaDB** database located at `data/chroma_db/`.
- **Ingestion Result:** **198 legal chunks** successfully indexed with comprehensive metadata tags (`source`, `doc_type`, `act_title`, `section_heading`).

---

### Phase 3: Semantic Retrieval Engine
- **Implementation:** [`rag/retrieval.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/retrieval.py)
- Built `query_database(query: str, n_results: int = 5)` to query ChromaDB by vector similarity.
- Returns formatted citations with source attribution and document chunk boundaries.

---

### Phase 4: Model Context Protocol (FastMCP) Server
- **Implementation:** [`mcp_server/server.py`](file:///home/adi/Documents/projects/nyaya-sahayak/mcp_server/server.py)
- Built a standard FastMCP server exposing 4 deterministic legal tools and 1 resource over `stdio`:
  - `search_bns_section(query: str)`: Instant lookup for IPC/BNS cross-references by section number or keyword.
  - `check_limitation_period(case_type: str)`: Exact limitation periods under the Limitation Act 1963, CrPC S.468, and Consumer Protection Act S.69.
  - `find_relevant_acts(situation: str)`: Categorization of citizen dispute descriptions into relevant statutory acts.
  - `search_legal_database(query: str)`: RAG vector lookup wrapper.
  - `legal://statistics` (Resource): Indian judicial backlog and court hierarchy statistics.

---

### Phase 5: LangGraph Multi-Agent Orchestration
- **Implementation:** Initial prototype in `main.py`
- Built the 4-agent stateful workflow using `langgraph.graph.StateGraph`:
  ```
                        ┌──────────────────┐
                        │   User Question  │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Supervisor Agent │ (Gemini zero-shot classifier)
                        └────────┬─────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
      ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
      │  Researcher   │  │    Action     │  │     Both      │
      │  (Multi-query │  │ (FastMCP over │  │ (Parallel RAG │
      │     RAG)      │  │    stdio)     │  │    + FastMCP) │
      └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Explainer Agent  │ (Synthesizer with Citations)
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   Final Answer   │
                        └──────────────────┘
  ```
- **Researcher Agent:** Employs multi-query expansion using Gemini to generate 2 alternative search phrasings, querying ChromaDB with all 3 queries and de-duplicating retrieved chunks by content hash.
- **Action Agent:** Spawns an MCP `stdio_client` subprocess to query tools and format structured outputs.
- **Explainer Agent:** Synthesizes legal citations, actionable citizen steps, advocate consultation advice, and standard legal disclaimers.

---

### Phase 6: Evaluation Suite & Benchmark Verification
- **Implementation:** [`evaluation/evaluate.py`](file:///home/adi/Documents/projects/nyaya-sahayak/evaluation/evaluate.py), `evaluation/test_queries.json`
- Designed a 10-query benchmark covering diverse legal domains:
  - Murder punishment (IPC 302 vs BNS 101)
  - Cheque bounce notice period (NI Act S.138)
  - Tenant eviction rights (Transfer of Property Act)
  - RTI filing fees and response timelines
  - Police arrest procedures without warrant (CrPC S.41)
  - Domestic violence remedies (DV Act 2005)
  - Consumer dispute filing deadlines (CPA 2019)
  - Fundamental Rights under Article 21
  - Drunk driving penalties (Motor Vehicles Act)
  - Wrongful employment termination without notice
- **Results:** 10/10 queries executed cleanly through the LangGraph pipeline with appropriate routing (`research`, `action`, or `both`) and zero runtime crashes.

---

### Tier 1 Full-Stack: Modularization, SQLite Memory & FastAPI Backend
- **Git Commits:**
  - `bb41f71` `feat(memory): implement sqlite-backed multi-turn conversation memory`
  - `b33c66f` `refactor(core): extract langgraph orchestration engine from main.py`
  - `7aae692` `feat(api): build fastapi rest and sse streaming backend for next.js`
- **Key Modules Created:**
  - [`core/memory.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/memory.py): `ConversationMemory` class with SQLite persistence, session isolation, context truncation, and session history management.
  - [`core/pipeline.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/pipeline.py): Extracted engine exposing `ask()` and `ask_with_trace()`. Added `conversation_history` to `AgentState`.
  - [`api/server.py`](file:///home/adi/Documents/projects/nyaya-sahayak/api/server.py): High-performance FastAPI server running on port 8000:
    - `GET /api/health`
    - `POST /api/ask` (full response with `AgentTrace` metadata)
    - `POST /api/ask/stream` (real-time SSE streaming emitting `session`, `trace`, `answer`, `done`, and `error` events)
    - `GET /api/sessions`, `GET /api/sessions/{id}/history`, `DELETE /api/sessions/{id}`
  - [`main.py`](file:///home/adi/Documents/projects/nyaya-sahayak/main.py): Refactored from 485 lines into a slim ~50 line CLI wrapper.

---

### Frontend: Next.js 15 & Indian Legal Themed Landing Page
- **Stack:** Next.js (App Router), TypeScript, Tailwind CSS v4.
- **Theme:** Indian Legal Palette (Deep Navy `#0a0e1a`, Saffron `#FF9933`, Emerald Green `#138808`, Tricolor gradients).
- **Landing Page ([`frontend/src/app/page.tsx`](file:///home/adi/Documents/projects/nyaya-sahayak/frontend/src/app/page.tsx)):**
  - Responsive Top Navigation with tricolor accent border and "Start Chatting" CTA.
  - Hero section with gradient typography, v2.0 Beta badge, trust indicators, and 3D mockup card.
  - 4 Capability cards with hover glow animations.
  - Visual Architecture Flowchart.
  - Live Demo simulation demonstrating Section 302 IPC to BNS 101 transition.
  - Technology stack badges (LangGraph, FastAPI, Next.js, ChromaDB, Gemini, MCP).
  - Branded Footer with author attribution.

---

### Performance Optimization: Lazy Model Singletons (1,128× Speedup)
- **Date:** 2026-10-17
- **Target File:** [`rag/retrieval.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/retrieval.py)
- **Problem Diagnosed:**
  In [`core/pipeline.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/pipeline.py), the `researcher_node` generates 3 multi-query variants and calls `query_database()` in a loop.
  Inside `query_database()`, the `SentenceTransformer` model and ChromaDB client were being instantiated *on every call*:
  ```python
  # Old Anti-Pattern (Called 3x per user query)
  model = SentenceTransformer(config.EMBEDDING_MODEL, device=config.DEVICE)
  client = chromadb.PersistentClient(path=config.CHROMA_PERSIST_DIR)
  ```
  This reloaded the PyTorch model weights and reopened SQLite files 3 times per query, causing massive latency (~21s spent in initialization).
- **Solution:**
  Refactored [`rag/retrieval.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/retrieval.py) to use lazy module-level singletons (`_get_model()`, `_get_collection()`):
  ```python
  _model: SentenceTransformer | None = None
  _collection: chromadb.Collection | None = None

  def _get_model() -> SentenceTransformer:
      global _model
      if _model is None:
          try:
              _model = SentenceTransformer(config.EMBEDDING_MODEL, device=config.DEVICE)
          except Exception:
              _model = SentenceTransformer(config.EMBEDDING_MODEL, device='cpu')
      return _model
  ```
- **Measured Benchmark:**
  - **Cold Start (Call 1):** 7.212s (loads weights into `cuda:0` once)
  - **Warm Call 2:** 0.006s (6 ms)
  - **Warm Call 3:** 0.005s (5 ms)
  - **Speedup:** **1,128.2× faster** on warm calls
  - **Net Reduction:** **~14.4 seconds eliminated** from every RAG retrieval loop!

---

### Issue #2 Optimization & Model Upgrade: Direct Tool Registry & Gemini 3.8 Flash
- **Date:** 2026-10-17
- **Target Files:** [`core/pipeline.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/pipeline.py), [`rag/config.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/config.py)
- **Problem Diagnosed:**
  1. **Subprocess Cold-Start Overhead:** On every `action` node execution, `action_node` spawned a new Python interpreter subprocess via `mcp.client.stdio.stdio_client` and `ClientSession` over `stdio`. Spawning a process, importing FastMCP, and performing JSON-RPC handshakes took **2.0–4.0s of pure cold-start overhead per request**.
  2. **Model Deprecation:** Google updated the Gemini free-tier endpoints, deprecating `gemini-2.5-flash` in favor of `gemini-3.8-flash`.
- **Solution:**
  1. **Direct Tool Execution via `TOOL_REGISTRY`:** Imported tool functions (`search_bns_section`, `check_limitation_period`, `find_relevant_acts`, `search_legal_database`) directly from `mcp_server.server` into `core/pipeline.py`. Kept the exact same tool schema and selection logic, but executed tools directly in-process as Python callables without subprocess spawning. (The standalone MCP server remains intact for external MCP clients).
  2. **Model Upgrade:** Updated `LLM_MODEL = "gemini-3.8-flash"` in [`rag/config.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/config.py).
  3. **Intelligent 429 Retry Backoff:** Enhanced `gemini_generate()` in [`core/pipeline.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/pipeline.py) to parse Google API's rate-limit response strings (`Please retry in Xs`) and back off dynamically rather than failing immediately.
- **Measured Result:**
### Issue #3 Architecture: Clean Pydantic Data Contracts for RAG
- **Date:** 2026-10-19
- **Target Files:** [`rag/retrieval.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/retrieval.py), [`core/pipeline.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/pipeline.py), [`mcp_server/server.py`](file:///home/adi/Documents/projects/nyaya-sahayak/mcp_server/server.py)
- **Problem Diagnosed:**
  In [`rag/retrieval.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/retrieval.py), `query_database()` previously flattened ChromaDB query results into an ASCII string separated by arbitrary dashed delimiters (`"-" * 50`).
  In [`core/pipeline.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/pipeline.py), the `researcher_node` had to parse that string back using `result_text.split("-" * 50)` and re-hash string slices for de-duplication:
  ```python
  # Old Anti-Pattern (String serialization / de-serialization)
  sections = result_text.split("-" * 50)
  for section in sections:
      content_hash = hash(section[:200])
      ...
  ```
  This anti-pattern caused three major issues:
  1. **Loss of Metadata:** Dropped vector cosine distances, unique chunk IDs, statutory Act titles, and section headings.
  2. **Fragility:** Any change to the ASCII separator broke multi-agent state parsing.
  3. **Poor Prompt Attribution:** The `explainer_node` received raw unformatted text blocks without explicit statutory act names or section boundaries.
- **Solution:**
  1. **Pydantic Data Contract:** Created `RetrievedChunk` model containing `id`, `text`, `source`, `doc_type`, `act_title`, `section_heading`, `distance`, and `metadata`.
  2. **Structured Query Output:** Updated `query_database()` to return `list[RetrievedChunk]`. Added `format_chunks_for_display()` for human-readable outputs and backwards-compatible MCP tool responses.
  3. **O(1) Hash-Set De-duplication:** Refactored `researcher_node` to de-duplicate chunks instantly by `chunk.id` without string regex slicing.
  4. **Attributed Explainer Synthesis:** Updated `explainer_node` to format research findings using rich statutory headers: `### [source.md] Act Title - Section Heading`.
- **Measured Result:**
  - Unit tests verified 100% typed object validation and field retention.
  - End-to-end multi-query research pipeline verified with zero string-splitting overhead.

---

### Issue #4 Architecture: Native Gemini Tool Calling & Resilient Model Fallback
- **Date:** 2026-10-20
- **Target Files:** [`core/pipeline.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/pipeline.py), [`rag/config.py`](file:///home/adi/Documents/projects/nyaya-sahayak/rag/config.py)
- **Problem Diagnosed:**
  In [`core/pipeline.py`](file:///home/adi/Documents/projects/nyaya-sahayak/core/pipeline.py), the `action_node` previously instructed Gemini via plain text prompts to return tool selections formatted as JSON:
  ```python
  # Old Anti-Pattern (Manual JSON Prompting & Regex Parsing)
  tool_selection_prompt = f"""Respond in this EXACT JSON format (no markdown, no code fences):
  {{"tool_name": "name_of_tool", "arguments": {{"param_name": "param_value"}}}}"""
  decision_text = gemini_generate(tool_selection_prompt)
  decision_text = decision_text.replace("```json", "").replace("```", "").strip()
  decision = json.loads(decision_text)
  ```
  This anti-pattern suffered from three critical production vulnerabilities:
  1. **Schema Non-Compliance & Hallucinations:** LLMs occasionally injected conversational preamble, trailing punctuation, or markdown fences that broke `json.loads()`.
  2. **Unenforced Argument Types:** Arguments could not be type-validated against strict schemas at generation time.
  3. **Fragile String Parsing:** Tools had to be manually extracted from free-form text strings instead of utilizing the Gemini SDK's structured `FunctionCall` objects.
- **Solution:**
  1. **Native Gemini Tool Declarations:** Built `_build_native_tools()` to translate `TOOL_REGISTRY` into native `types.Tool(function_declarations=[...])` with strict parameter JSON schemas.
  2. **SDK Function Calling Protocol:** Configured `client.models.generate_content` with `tools=tools`, `temperature=0.0`, and `automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)`. This allows Gemini to decide the function call natively while allowing our runtime to execute the Python callable in-process without spawning secondary LLM round-trips.
  3. **Zero-Parsing Extraction:** Replaced all string cleaning and JSON decoding with typed `response.function_calls[0].name` and `response.function_calls[0].args`.
  4. **Multi-Model High-Demand Resilience:** Configured `gemini-3.5-flash` with dynamic fallback to `gemini-flash-latest` and exponential backoff to handle transient 503/429 spikes smoothly.
- **Measured Result:**
  - 100% elimination of regex/code-fence stripping and `JSONDecodeError` exceptions in tool selection.
  - Native function call resolution executed in ~3.1s with exact argument type validation (e.g., `check_limitation_period(case_type='cheque_bounce')`).
  - End-to-end `ask_with_trace` pipeline successfully routed, tool-called, and synthesized answers without failures.

---

### Issue #5 Architecture: Technical Dossier Landing Page & 3-Column Consultation Workspace (/chat)
- **Date:** 2026-11-04
- **Target Files:** [`frontend/src/app/globals.css`](file:///home/adi/Documents/projects/nyaya-sahayak/frontend/src/app/globals.css), [`frontend/src/app/page.tsx`](file:///home/adi/Documents/projects/nyaya-sahayak/frontend/src/app/page.tsx), [`frontend/src/app/chat/page.tsx`](file:///home/adi/Documents/projects/nyaya-sahayak/frontend/src/app/chat/page.tsx), [`frontend/src/components/*`](file:///home/adi/Documents/projects/nyaya-sahayak/frontend/src/components)
- **Problem Diagnosed:**
  The frontend required an authoritative, high-density interface reflecting the serious nature of statutory Indian jurisprudence. Modern generic "SaaS chat bubbles" fail to convey the rigor, auditability, and deterministic precision required for legal intake. Additionally, users needed real-time visibility into the multi-agent StateGraph orchestration pipeline (Supervisor routing, FastMCP tool selection, and RAG retrieval) rather than opaque loading spinners.
- **Solution:**
  1. **Aesthetic & Typographic System:** Implemented the "Technical Dossier / Legal Brutalism" design language matching the approved specifications:
     - Warm legal parchment background (`#F3EBDE`), ink black typography (`#1B1C1E`), hairline borders (`#C9BFB0`), and legal stamp red accents (`#9E1B1B`).
     - Quad-font stack: *Playfair Display* (statutory headers), *Noto Serif Devanagari* (Hindi bilingual identity), *IBM Plex Mono* (telemetry & data contracts), and *Newsreader* (legal memorandum body).
     - Precision drafting accents: register crosshairs (`+`), corner brackets (`⌜ ⌝ ⌞ ⌟`), registration marks (`⌖`), millimeter rules, and tilted distressed rubber stamps (`[APPROVED]`, `[STATEGRAPH: STREAMING]`).
  2. **Long-Format Technical Landing Page (`/`):**
     - **Navbar & FIG 01 Hero:** Real-time backend engine connectivity monitor (`🟢 ENGINE ONLINE` / `🟡 DEMO SIMULATION`), bilingual branding, and cropped archival artwork plate.
     - **FIG 02 Benchmark Telemetry:** 4 metric cards highlighting verified system performance (1,128.2× retrieval speedup with custom SVG oscilloscope sparkline, <1ms FastMCP tool execution, 358+ BNS cross-referenced sections, 100% Pydantic attribution).
     - **FIG 03 LangGraph Pipeline:** Interactive SVG architecture flowchart depicting the Supervisor, Researcher, Action, and Explainer nodes with hover inspectable state schemas.
     - **FIG 04 Statutory Modules:** 2×2 dossier grid covering IPC-to-BNS statutory conversion, Limitation Act procedural timelines, grounded ChromaDB RAG, and SQLite multi-turn session persistence.
     - **FIG 05 Case Logs & Colophon:** Interactive 3-tab legal case logs with direct "Try this case in live Chat ➔" query handoff, Advocates Act 1961 statutory disclaimer, and system colophon.
  3. **3-Column Legal Consultation Workspace (`/chat`):**
     - Perfectly mirrors the `/home/adi/Downloads/Chatbot.png` design specification:
     - **Left Column (SQLite Dossier Archive):** Real-time integration with `GET /api/sessions`, dynamic case cards (`#104 Cheque Bounce`, `#103 IPC 302`, `#102 Tenancy`, `#101 Land Title`, `#100 Contract Breaches`), and `[+ NEW LEGAL CONSULTATION]` action.
     - **Center Column (Citizen Intake Terminal):** Natural language citizen query box, structured Legal Memorandum with statutory metadata badges (`STATUTE REFERENCE: ni_act_1881.md S.138`), highlighted red statutory limitation callout (`❴ STATUTORY LIMITATION: ...`), and interactive 3-step procedural checklist with clickable checkboxes (`☑`/`☐`).
     - **Right Column (FIG 06 Live Agent Trace):** Real-time multi-agent StateGraph visualization (`User Query Input` ➔ `Step 01: SUPERVISOR ROUTER` ➔ `Step 02: ACTION AGENT FastMCP` ➔ `Step 03: EXPLAINER AGENT` ➔ `Finalized Memo`), connected to Server-Sent Events (`POST /api/ask/stream`) with graceful fallback simulation.
- **Measured Result:**
  - Next.js 16 Turbopack production build compiles with zero errors in ~560ms.
  - Zero external heavyweight canvas or flowchart dependencies; all diagrams rendered with pure semantic SVG and CSS.
  - Full end-to-end parameter passing from Landing Page case logs (`/chat?q=...`) to live consultation workspace.

---

### Issue #6 Architecture: Automated RAG Triad Evaluation (LLM-as-a-Judge) & Gemini Quota Optimization
- **Date:** 2026-11-05
- **Target Files:** [`evaluation/schemas.py`](file:///home/adi/Documents/projects/nyaya-sahayak/evaluation/schemas.py), [`evaluation/rag_triad_judge.py`](file:///home/adi/Documents/projects/nyaya-sahayak/evaluation/rag_triad_judge.py), [`evaluation/evaluate.py`](file:///home/adi/Documents/projects/nyaya-sahayak/evaluation/evaluate.py), [`evaluation/test_queries.json`](file:///home/adi/Documents/projects/nyaya-sahayak/evaluation/test_queries.json), [`evaluation/results.md`](file:///home/adi/Documents/projects/nyaya-sahayak/evaluation/results.md)
- **Problem Diagnosed (API Burst Throttle & 503 High Demand Spikes):**
  During initial execution of the automated RAG Triad evaluation suite on the 15-query legal benchmark, the test runner encountered severe rate limiting (`429 RESOURCE_EXHAUSTED`, `Please retry in 29.8s...`) and cloud capacity errors (`503 UNAVAILABLE: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.`).
  
  *Root Cause Analysis:*
  1. **Cascading API Waterfall Explosion:** The initial unoptimized evaluation harness made **7 separate sequential LLM API calls per test scenario**:
     - 4 multi-agent pipeline calls: Supervisor routing -> Researcher multi-query expansion -> Action native function calling -> Explainer memorandum synthesis.
     - 3 separate judicial calls: `evaluate_faithfulness` (atomic claim decomposition) -> `evaluate_relevance` (directness/completeness) -> `evaluate_context_precision` (retrieval rank scoring).
  2. **Free-Tier Quota Ceiling (15 RPM):** Across a 15-scenario benchmark, this naive execution totaled $15 \times 7 = 105$ cloud API calls. With Google Gemini free tier strictly capped at **15 Requests Per Minute (RPM)** and low burst tolerances, Query #2 pushed the per-minute quota over the edge, causing cascading 30-second backoffs and process halts.
  3. **High-Demand Flakiness:** The endpoint for `gemini-3.8-flash` suffered regional capacity spikes (503 UNAVAILABLE), whereas lightweight models (`gemini-3.5-flash-lite`, `gemini-flash-lite-latest`) remained responsive with sub-1.5s latency.

- **Architectural Solution & Multi-Part Optimization:**
  1. **Single-Pass Unified Judicial Evaluation:**
     - Consolidated atomic claim decomposition, verbatim evidence citation verification (Faithfulness), and query directness/completeness (Relevance) into **a single structured JSON prompt**.
     - Eliminated 2 out of 3 judicial LLM round-trips (**66.7% reduction in judge API overhead**).
  2. **Deterministic Context Precision in Python (0 API Calls):**
     - Replaced non-deterministic LLM grading of retrieved context chunks with deterministic metadata and statutory source matching in Python (`<1ms` latency, 0 token consumption).
     - Cross-references retrieved chunks against the benchmark ground truth `expected_source` (e.g. `constitution.json`, `ni_act_1881.md`, `ipc_bns_mapping.json`) to compute rank-weighted precision and Mean Reciprocal Rank (MRR).
     - Pure tool-based queries (MCP action route) with 0 vector chunks are deterministically assigned 1.0 (N/A).
  3. **Multi-Model High-Availability Fallback Chain:**
     - Configured the judge client with automatic fallback across healthy Gemini endpoints (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-flash-lite-latest`, `gemini-3.8-flash`).
     - Added regex parsing of rate-limit backoff durations (`Please retry in Xs`) with bounded exponential retry delays.
  4. **Strict Rate-Limit Pacing & CLI Controls:**
     - Added an asynchronous 4.0s sleep between evaluation turns in [`evaluation/evaluate.py`](file:///home/adi/Documents/projects/nyaya-sahayak/evaluation/evaluate.py).
     - Combined with the unified judge, total calls per query are capped at 4-5 calls over ~10-12s, strictly guaranteeing compliance under the 15 RPM quota (~6-8 RPM throughput).
     - Added CLI flags `--limit <N>` and `--ids <id1,id2>` for rapid subset verification and regression testing.
  5. **Adversarial & Edge-Case Benchmark Dataset (15 Scenarios):**
     - Expanded test dataset from 10 to 15 queries covering criminal law (IPC 302 -> BNS 101, arrest without warrant), commercial statutes (NI Act S.138 30-day notice), constitutional rights (Art 14, 19, 21, 32), civil disputes (e-Daakhil, MACT, industrial retrenchment), procedural codes (BNSS 175(3) preliminary inquiry), and negative control / adversarial hallucination check (Section 999 BNS).

- **Measured Result:**
  - Judge API calls reduced from 3 to 1 per turn (66.7% reduction).
  - Context precision evaluation latency dropped from ~2.5s (LLM call) to **<0.001s** (deterministic Python computation).
  - Eliminates cascading 429 quota exhaustion and 503 unavailability locks during automated runs.
  - Final Automated Benchmark: **15 / 15 (100.0%) PASS**, **100.0% Faithfulness** (Zero hallucinations detected), **97.4% Answer Relevance**, **96.2% Context Precision**, and **98.3% Composite Score**.

### Issue #7 Architecture: End-to-End Pipeline Latency Optimization & Real-Time Token Streaming
- **Date:** 2026-11-06
- **Branch:** `perf-latency`
- **Objective:** Eliminate the 4-step cloud LLM waterfall (Supervisor -> Researcher Multi-Query -> Action Selection -> Explainer) and reduce turn latency from ~25-40s down to ~3.0s, reducing perceived Time to First Token (TTFT) from 24s to under 1.5s.
- **Root Cause Analysis:**
  1. A standard consultation executed 4 sequential cloud LLM calls over HTTP: Supervisor classification (~3.2s) -> Multi-query expansion (~4.5s) -> Action function selection (~3.1s) -> Explainer memorandum synthesis (~16.5s).
  2. The local dense embedding model (`sentence-transformers/all-MiniLM-L6-v2`) and ChromaDB suffered cold-start initialization latency on the first query of up to 7-10s.
  3. Redundant multi-query generation: 384-dimensional dense embeddings already capture semantic synonyms in vector space, making LLM re-phrasing redundant for high-confidence vector matches.
  4. Explainer generation ran synchronously before sending SSE events, forcing the citizen to stare at a spinner for ~24 seconds before the first character rendered.
- **Architectural Solution:**
  1. **FastAPI Lifespan Embedding Pre-Warming:**
     - Pre-loads PyTorch weights and ChromaDB client into memory during FastAPI server startup via `prewarm_retrieval_engine()`.
     - Completely eliminates cold-start delay for the first incoming query.
  2. **Deterministic Fast-Path Router (<1ms vs ~3.5s):**
     - Evaluates statutory regex heuristics before calling cloud LLM.
     - Detects direct section citations (`Section 302 IPC`, `Section 999 BNS`), limitation lookups (`limitation period`), and procedural remedies (`tenant rights`, `how to file RTI`).
     - Directly routes 93.3% of benchmark queries with sub-millisecond latency (<0.001s), while falling back to Gemini zero-shot classifier for ambiguous queries.
  3. **Adaptive Direct-Path Vector Search (5.2ms vs ~4.5s):**
     - Queries local ChromaDB directly on CUDA with natural language query (k=5).
     - If >= 3 statutory chunks are retrieved, bypasses the Gemini multi-query expansion prompt entirely, saving 4.5s and 1 cloud API call.
     - Preserves Gemini multi-query generation as an automated fallback if initial vector density is sparse (< 3 chunks).
  4. **Concurrent ThreadPool Execution in Combined DAG (`both_node`):**
     - Executes `researcher_node` and `action_node` simultaneously in parallel threads via `concurrent.futures.ThreadPoolExecutor(max_workers=2)`.
     - Overlaps vector retrieval and tool execution, reducing `both_node` execution time by ~50%.
  5. **Real-Time Token Streaming with Queue-Bridged SSE:**
     - Bridges Gemini SDK's synchronous `generate_content_stream` into FastAPI's asynchronous SSE generator using a thread-safe `asyncio.Queue`.
     - Yields `answer_chunk` events token-by-token to the Next.js 16 frontend.
     - Perceived Time to First Token (TTFT) collapsed from ~24s down to **0.908s - 1.924s** (up to 96.2% reduction).
  6. **Zero Regression Safety Verification:**
     - Executed full RAG Triad benchmark verification across Research, Action, and Both routes: **15 / 15 (100.0%) PASS**, with **100.0% Faithfulness**, **97.4% Relevance**, and **96.2% Precision**.

---

## 4. Benchmark & Profiling History

| Date | Component | Metric / Test | Before | After | Delta / Speedup |
|:---|:---|:---|:---|:---|:---|
| **2026-06-19** | Evaluation Suite | 10-query benchmark pass rate | 0/10 (untested) | 10/10 passed | 100% test reliability |
| **2026-08-28** | Backend Architecture | API response structure | CLI only (sync) | REST + SSE Stream | Real-time frontend readiness |
| **2026-10-17** | RAG Retrieval Path | Embedding + ChromaDB warm latency | ~7.2s / call | **0.005s / call** | **1,128.2x faster** (~14s saved/turn) |
| **2026-10-17** | Tool Execution Path | Subprocess MCP client startup | ~2.5s / invocation | **<0.001s / invocation** | **Subprocess eliminated** (~2.5s saved/turn) |
| **2026-10-17** | LLM Engine | Foundation model & resilience | gemini-2.5-flash | **gemini-3.8-flash** | Deprecation fixed + 429 backoff resilience |
| **2026-10-19** | RAG Data Pipeline | Inter-node chunk serialization | ASCII `split('-'*50)` | **Pydantic `RetrievedChunk`** | Clean typing + zero parsing fragility |
| **2026-10-20** | Agent Tool Calling | Tool selection protocol | Manual JSON prompt + regex | **Native Gemini Function Calling** | 100% schema compliance, 0 parsing failures |
| **2026-11-04** | Frontend Architecture | Next.js 16 Technical Dossier & Chat | None (CLI/Swagger only) | **Full Landing Page + 3-Col Workspace** | Complete visual design & SSE streaming |
| **2026-11-05** | Evaluation Suite | Judge API calls & quota consumption | 7 LLM calls/turn, 429/503 errors | **1 unified judge call + deterministic precision (0 API calls)** | **66.7% reduction in judge calls**, zero quota exhaustion |
| **2026-11-06** | Evaluation Suite | 15-scenario RAG Triad Benchmark | 0/15 (untested with LLM judge) | **15 / 15 (100.0%) PASS** | **100.0% Faithfulness, 97.4% Relevance, 96.2% Precision, 98.3% Composite** |
| **2026-11-06** | Pipeline Routing | Supervisor intent classification | ~3.2s (Cloud LLM) | **0.001s (<1ms)** | **3,200x faster** (Deterministic Fast-Path) |
| **2026-11-06** | Retrieval Node | Semantic statutory context search | ~4.5s (LLM Multi-Query) | **0.022s (22ms)** | **204x faster** (Adaptive Direct Dense RAG) |
| **2026-11-06** | Combined DAG | Both node (Research + Action) | ~7.7s (Sequential) | **0.760s** | **10.1x faster** (Concurrent ThreadPool) |
| **2026-11-06** | User Experience | Perceived Time to First Token (TTFT) | ~24.2s (Synchronous block) | **0.908s - 1.924s** | **92.1% - 96.2% reduction in perceived wait time** |
| **2026-11-06** | End-to-End Latency | Full legal turn completion | ~26.0s - 35.0s | **3.019s - 3.305s** | **8.6x - 10.6x overall turn acceleration** |

---

## 5. Active Roadmap & Backlog

- [x] **Phase 1–6:** Core RAG, FastMCP server, LangGraph multi-agent, and Evaluation Suite.
- [x] **Tier 1 Backend:** SQLite multi-turn memory, FastAPI REST/SSE endpoints.
- [x] **Frontend Landing Page:** Next.js 15 + Tailwind CSS v4 responsive legal landing page.
- [x] **Issue #1 (Perf):** Lazy module singletons for SentenceTransformer and ChromaDB.
- [x] **Issue #2 (MCP Architecture):** Direct in-memory tool execution registry eliminating subprocess overhead.
- [x] **Issue #3 (Data Contracts):** Refactor `query_database()` to return structured Pydantic models instead of string-delimited chunks.
- [x] **Issue #4 (Agentic Function Calling):** Replace manual JSON prompting in `action_node` with native Gemini Tool Calling.
- [x] **Issue #5 (Frontend Architecture & Workspace):** Build the Technical Dossier Landing Page (`/`) and 3-column Legal Consultation Workspace (`/chat`) matching `fullpage.png` and `Chatbot.png`.
- [x] **Issue #6 (Evaluation Rigor):** Automate RAG evaluation metrics (Faithfulness, Groundedness, Context Precision) using an automated LLM judge with single-pass optimization and deterministic precision.
- [x] **Issue #7 (Pipeline Latency Optimization):** Eliminated cloud LLM waterfall (collapsed 4 sequential Gemini calls to 1-2 calls, implemented <1ms deterministic fast-path router, adaptive direct vector search in 5ms, concurrent DAG execution, and real-time SSE token streaming cutting TTFT from 24s to <1.5s).
- [ ] **Issue #8 (Zero-Cost Production Deployment — Option 1):** Deploy full-stack Nyaya Sahayak at $0 cost forever:
  - **Backend (Hugging Face Spaces):** Docker container with 2 vCPUs + 16GB free RAM running FastAPI (`uvicorn api.server:app --port 7860`), pre-baked ChromaDB statutory vector store, and SQLite WAL memory.
  - **Frontend (Vercel):** Next.js 16 Edge deployment from `frontend` branch with `NEXT_PUBLIC_API_URL` pointing to the Hugging Face Space.
  - **CORS & Keep-Alive:** Configure unbuffered SSE streaming and CORS headers for secure browser-to-backend real-time communication.

