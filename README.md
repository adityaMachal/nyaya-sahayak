# Nyaya Sahayak (न्याय सहायक) — Indian Law AI Assistant

## Domain
Indian law is incredibly complex, with a mix of colonial-era laws, newly updated codes (like the BNS replacing the IPC), and specific procedural limitations. A general LLM often struggles here, hallucinating non-existent sections or blending Indian law with US/UK law. **Nyaya Sahayak** solves this by using a Multi-Agent architecture grounded entirely in verified Indian legal texts via Retrieval-Augmented Generation (RAG) and deterministic MCP tools.

## Architecture
This project uses a LangGraph `StateGraph` with 4 main routing nodes:

```mermaid
graph TD
    User([User Question]) --> Supervisor
    
    Supervisor{Supervisor<br/>(Gemini Classifies)}
    Supervisor -->|research| Researcher
    Supervisor -->|action| Action
    Supervisor -->|both| Both
    
    Researcher[Researcher Node<br/>(Multi-query RAG)]
    Action[Action Node<br/>(MCP Client over stdio)]
    Both[Both Node<br/>(RAG + MCP)]
    
    Researcher --> Explainer
    Action --> Explainer
    Both --> Explainer
    
    Explainer[Explainer Node<br/>(Gemini Synthesis)]
    Explainer --> Final([Final Answer])
```

## Features
- **Accurate Indian Context:** Grounded in a local ChromaDB of key Indian laws (Constitution, RTI, Consumer Protection, etc.).
- **Up-to-Date Lookups:** Dynamically maps old IPC sections to the new BNS (Bharatiya Nyaya Sanhita) using a FastMCP tool.
- **Deterministic Rules:** Uses exact dictionaries for Limitation Periods rather than probabilistic LLM guessing.
- **Citizen-Friendly:** Outputs answers with clear steps, section citations, and advice on when to consult a lawyer.

## Setup
1. Clone the repository
2. Install `uv` (the fast Python package installer)
3. Create a `.env` file in the root directory and add your API key:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   ```
4. Install dependencies:
   ```bash
   uv sync
   ```
5. Index the documents into ChromaDB:
   ```bash
   uv run python -m rag.indexing
   ```
6. Run the interactive assistant:
   ```bash
   uv run python main.py
   ```

## Evaluation
An evaluation script is available in the `evaluation/` folder. It tests 10 diverse legal queries against the pipeline.
- Run tests: `uv run python evaluation/evaluate.py`
- View results template: `evaluation/results.md`

## Demo Video
[Link to YouTube Video Here]
