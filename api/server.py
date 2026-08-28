"""
Nyaya Sahayak — FastAPI Backend

REST + SSE API designed for a Next.js frontend.

Endpoints:
    GET  /api/health                    — Health check
    POST /api/ask                       — Ask a question (full JSON response)
    POST /api/ask/stream                — Ask a question (SSE stream with agent trace)
    GET  /api/sessions                  — List all chat sessions
    GET  /api/sessions/{id}/history     — Get chat history for a session
    DELETE /api/sessions/{id}           — Delete a session

Run with:
    uv run uvicorn api.server:app --host 0.0.0.0 --port 8000 --reload
"""

import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from core.memory import ConversationMemory
from core.pipeline import ask_with_trace, app as langgraph_app


# ── Lifespan ───────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle events."""
    print("🏛️  Nyaya Sahayak API starting...")
    yield
    print("🏛️  Nyaya Sahayak API shutting down.")


# ── FastAPI App ────────────────────────────────────────────────────

app = FastAPI(
    title="Nyaya Sahayak API",
    description="Multi-Agent Indian Legal AI Assistant — REST + SSE Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (for Next.js frontend) ───────────────────────────────────

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Models (TypeScript-friendly) ─────────────────────────

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000,
                          description="The legal question to ask")
    session_id: str | None = Field(
        None,
        description="Pass an existing session_id for follow-up questions. Omit to start a new session."
    )


class AgentTrace(BaseModel):
    """Metadata about the pipeline execution."""
    route: str = Field(description="Routing decision: research, action, or both")
    tool_used: str = Field(description="MCP tool called (empty if none)")
    chunks_retrieved: int = Field(description="Number of RAG chunks retrieved")
    query_variants: list[str] = Field(description="Multi-query expansions used for retrieval")


class AskResponse(BaseModel):
    answer: str
    session_id: str
    trace: AgentTrace


class SessionInfo(BaseModel):
    session_id: str
    created_at: str
    last_active: str
    turn_count: int


class ChatMessage(BaseModel):
    role: str = Field(description="user or assistant")
    content: str
    timestamp: str


# ── Endpoints ──────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/ask", response_model=AskResponse)
async def ask_question(req: AskRequest):
    """Ask a legal question. Returns the full answer with agent trace metadata.

    Pass a `session_id` to continue a previous conversation (multi-turn).
    Omit `session_id` to start a new chat session.
    """
    memory = ConversationMemory(session_id=req.session_id)

    try:
        result = await ask_with_trace(req.question, memory)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

    return AskResponse(
        answer=result.get("final_answer", ""),
        session_id=memory.session_id,
        trace=AgentTrace(
            route=result.get("next_step", ""),
            tool_used=result.get("tool_name_used", ""),
            chunks_retrieved=len(result.get("retrieved_chunks", [])),
            query_variants=result.get("query_variants", []),
        )
    )


@app.post("/api/ask/stream")
async def ask_stream(req: AskRequest):
    """Ask a legal question with Server-Sent Events (SSE) streaming.

    Streams real-time agent execution steps as each LangGraph node completes.
    The Next.js frontend can use the Fetch API's ReadableStream to consume this.

    SSE Event Types:
        - session:  { session_id }          — Sent immediately
        - trace:    { node, route?, ... }   — After each node completes
        - answer:   { content }             — Final answer from Explainer
        - done:     {}                      — Stream complete
        - error:    { message }             — If an error occurs
    """

    async def event_generator():
        memory = ConversationMemory(session_id=req.session_id)

        # Send session_id immediately so the frontend can track it
        yield f"data: {json.dumps({'type': 'session', 'session_id': memory.session_id})}\n\n"

        try:
            # Build initial state
            history_text = memory.format_history_for_prompt()
            initial_state = {
                "messages": [{"role": "user", "content": req.question}],
                "user_question": req.question,
                "conversation_history": history_text,
                "next_step": "",
                "retrieved_chunks": [],
                "query_variants": [],
                "tool_results": [],
                "tool_name_used": "",
                "final_answer": ""
            }

            # Use astream with "updates" mode to get node-by-node outputs
            async for event in langgraph_app.astream(initial_state, stream_mode="updates"):
                for node_name, node_output in event.items():
                    if node_name == "supervisor":
                        yield f"data: {json.dumps({'type': 'trace', 'node': 'supervisor', 'route': node_output.get('next_step', '')})}\n\n"

                    elif node_name == "researcher":
                        yield f"data: {json.dumps({'type': 'trace', 'node': 'researcher', 'chunks': len(node_output.get('retrieved_chunks', [])), 'variants': node_output.get('query_variants', [])})}\n\n"

                    elif node_name == "action":
                        yield f"data: {json.dumps({'type': 'trace', 'node': 'action', 'tool': node_output.get('tool_name_used', '')})}\n\n"

                    elif node_name == "both":
                        yield f"data: {json.dumps({'type': 'trace', 'node': 'both', 'chunks': len(node_output.get('retrieved_chunks', [])), 'tool': node_output.get('tool_name_used', '')})}\n\n"

                    elif node_name == "explainer":
                        answer = node_output.get("final_answer", "")
                        # Save to memory
                        memory.add_turn("user", req.question)
                        memory.add_turn("assistant", answer)
                        yield f"data: {json.dumps({'type': 'answer', 'content': answer})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@app.get("/api/sessions", response_model=list[SessionInfo])
async def list_sessions():
    """List all conversation sessions.

    Returns sessions sorted by most recently active first.
    Use this for the sidebar in the Next.js frontend.
    """
    sessions = ConversationMemory.list_sessions()
    return [SessionInfo(**s) for s in sessions]


@app.get("/api/sessions/{session_id}/history", response_model=list[ChatMessage])
async def get_session_history(session_id: str):
    """Get the full chat history for a specific session.

    Returns messages in chronological order (oldest first).
    Use this when a user clicks a past session in the sidebar.
    """
    memory = ConversationMemory(session_id=session_id)
    history = memory.get_history(limit=100)

    if not history:
        raise HTTPException(status_code=404, detail="Session not found or empty")

    return [ChatMessage(**msg) for msg in history]


@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a conversation session and all its history.

    Use this for the 'Clear chat' or delete button in the frontend.
    """
    memory = ConversationMemory(session_id=session_id)
    memory.clear()
    return {"status": "deleted", "session_id": session_id}
