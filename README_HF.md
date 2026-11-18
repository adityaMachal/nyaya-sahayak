---
title: Nyaya Sahayak API
emoji: 🏛️
colorFrom: red
colorTo: gray
sdk: docker
app_port: 7860
pinned: false
---

# Nyaya Sahayak (न्याय सहायक) — Backend API

Dockerized FastAPI backend for Nyaya Sahayak, a multi-agent statutory intelligence engine under Indian jurisprudence.

## Architecture
- **LangGraph Multi-Agent Orchestration:** Deterministic DAG coordinating Supervisor, FastMCP tools, Adaptive Vector RAG, and Explainer synthesis.
- **Pre-baked ChromaDB Vector Store:** Instant startup with embedded Indian statutes (BNS 2023, BNSS 2023, BSA 2023, Constitution of India, Consumer Protection Act, NI Act, etc.).
- **Real-Time SSE Streaming:** Sub-second Time to First Token (TTFT) via unbuffered HTTP streaming.

## Public Endpoints
- `GET /api/health` — Health status check
- `GET /docs` — Interactive OpenAPI Swagger documentation
- `POST /api/ask` — Synchronous query evaluation with full trace
- `POST /api/ask/stream` — Server-Sent Events (SSE) streaming for real-time token delivery
- `GET /api/sessions` — SQLite WAL conversation sessions
- `GET /api/sessions/{id}/history` — Historical multi-turn consultation log

## Required Secrets
- `GEMINI_API_KEY` — Google Gemini API key (configured in Space Settings ➔ Variables and Secrets)
- `CORS_ORIGINS` (optional) — Comma-separated list of allowed frontend origins (e.g. `https://your-frontend.vercel.app`)
