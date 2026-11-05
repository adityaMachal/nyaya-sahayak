"""
Nyaya Sahayak — LangGraph Multi-Agent Pipeline (Core Engine)

This module contains the complete LangGraph StateGraph pipeline,
extracted from main.py for reuse across CLI, FastAPI, and other interfaces.

Architecture:
    User Question
         │
    ┌────▼────┐
    │Supervisor│ (Gemini classifies → research / action / both)
    └────┬────┘
         │
    ┌────┼──────────┐
    ▼    ▼          ▼
 Research Action   Both
 (RAG)   (MCP)   (RAG+MCP)
    │    │          │
    └────┼──────────┘
         ▼
    ┌─────────┐
    │Explainer│ (Gemini synthesizes citizen-friendly answer)
    └─────────┘
"""

import asyncio
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Annotated, Literal, TypedDict

import operator
from dotenv import load_dotenv
from google import genai
from google.genai import types
from langgraph.graph import END, StateGraph

from core.memory import ConversationMemory

# ── Environment Setup ──────────────────────────────────────────────
load_dotenv()

PROJECT_ROOT = str(Path(__file__).parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from rag.retrieval import query_database, format_chunks_for_display, RetrievedChunk
from rag import config

# ── Direct Tool Registry ──────────────────────────────────────────
# Import MCP tool functions directly instead of spawning a subprocess
# per request.  The MCP server (mcp_server/server.py) still exists
# for external MCP clients (IDEs, other agents); this registry is
# for internal pipeline use, eliminating ~2-4s cold-start overhead.

from mcp_server.server import (
    search_bns_section,
    check_limitation_period,
    find_relevant_acts,
    search_legal_database,
)

TOOL_REGISTRY: dict[str, dict] = {
    "search_bns_section": {
        "fn": search_bns_section,
        "description": (
            "Search Indian Penal Code (IPC) and Bharatiya Nyaya Sanhita (BNS) sections. "
            "Accepts a section number (e.g. '420', '302') or a keyword (e.g. 'theft', 'murder')."
        ),
        "parameters": {
            "query": {"type": "string", "description": "Section number or keyword to search for."}
        },
    },
    "check_limitation_period": {
        "fn": check_limitation_period,
        "description": "Look up the statute of limitations (time limit) for filing a legal case in India.",
        "parameters": {
            "case_type": {
                "type": "string",
                "description": (
                    "Type of case. One of: civil_suit, criminal_complaint, consumer_complaint, "
                    "cheque_bounce, property_dispute, motor_accident, labor_dispute, divorce"
                ),
            }
        },
    },
    "find_relevant_acts": {
        "fn": find_relevant_acts,
        "description": "Given a situation description, find the most relevant Indian laws and acts.",
        "parameters": {
            "situation": {
                "type": "string",
                "description": "Plain English description (e.g. 'my employer hasn't paid salary for 3 months')",
            }
        },
    },
    "search_legal_database": {
        "fn": search_legal_database,
        "description": (
            "Search the Nyaya Sahayak legal database for Indian laws, IPC/BNS mappings, "
            "constitutional articles, and consumer/labor/property laws."
        ),
        "parameters": {
            "query": {"type": "string", "description": "The natural language search query."}
        },
    },
}


def _build_native_tools() -> list[types.Tool]:
    """Convert TOOL_REGISTRY into native Gemini FunctionDeclaration tools."""
    declarations = []
    for name, info in TOOL_REGISTRY.items():
        declarations.append(
            types.FunctionDeclaration(
                name=name,
                description=info["description"],
                parameters_json_schema={
                    "type": "object",
                    "properties": info["parameters"],
                    "required": list(info["parameters"].keys()),
                },
            )
        )
    return [types.Tool(function_declarations=declarations)]



# ── Gemini Client ──────────────────────────────────────────────────

def get_gemini_client() -> genai.Client:
    """Create a Gemini client using the API key from environment."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ Error: GEMINI_API_KEY not found in environment.")
        print("   Please add it to your .env file:")
        print('   GEMINI_API_KEY=your_key_here')
        sys.exit(1)
    return genai.Client(api_key=api_key)


client = get_gemini_client()
MODEL = config.LLM_MODEL


def gemini_generate(prompt: str, max_retries: int = 3) -> str:
    """Call Gemini with automatic retry on transient errors (503, 429, etc.)."""
    models_to_try = [MODEL, getattr(config, "FALLBACK_MODEL", "gemini-flash-latest")]
    last_err = None
    for model_name in models_to_try:
        for attempt in range(1, max_retries + 1):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                )
                return response.text.strip()
            except Exception as e:
                last_err = e
                error_str = str(e)
                is_retryable = any(code in error_str for code in ["503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED"])
                if is_retryable and attempt < max_retries:
                    delay_match = re.search(r'retry in ([\d\.]+)s', error_str, re.IGNORECASE)
                    wait = min(float(delay_match.group(1)) + 1.0, 60.0) if delay_match else (2 ** attempt)
                    print(f"  ⏳ Gemini API rate-limited/busy on {model_name} (attempt {attempt}/{max_retries}), retrying in {wait:.1f}s...")
                    time.sleep(wait)
                else:
                    break
    if last_err:
        raise last_err
    raise RuntimeError("gemini_generate failed with unknown error")


# ── Agent State ────────────────────────────────────────────────────

class AgentState(TypedDict):
    # Accumulates all messages (user query, agent thoughts, tool results)
    messages: Annotated[list, operator.add]

    # The original user question (never changes)
    user_question: str

    # Formatted conversation history from previous turns (for follow-ups)
    conversation_history: str

    # Routing decision from Supervisor
    next_step: Literal["research", "action", "both"]

    # Filled by Researcher node
    retrieved_chunks: list[dict]       # Raw chunks from hybrid search
    query_variants: list[str]          # Multi-query expansions

    # Filled by Action node
    tool_results: list[dict]           # Results from MCP tool calls
    tool_name_used: str                # Which MCP tool was called

    # Filled by Explainer node
    final_answer: str                  # Citizen-friendly formatted answer


# ══════════════════════════════════════════════════════════════════
# NODE 1: SUPERVISOR — Classifies the query and routes
# ══════════════════════════════════════════════════════════════════

def supervisor_node(state: AgentState) -> dict:
    """Analyze the user's question and decide the routing."""

    question = state["user_question"]

    prompt = f"""You are a legal query classifier for an Indian law assistant.

Classify this legal query into EXACTLY ONE category:

- "research": General questions about rights, procedures, legal concepts, explanations of law.
  Examples: "What are my rights as a tenant?", "How to file RTI?", "What are grounds for divorce?"

- "action": Specific section lookups, limitation period checks, or mapping a situation to relevant acts.
  Examples: "What is Section 420 IPC?", "What is limitation for consumer complaint?", "Section 302"

- "both": Needs BOTH general context AND a specific lookup — combines explanation with specific data.
  Examples: "What is the limitation period for consumer complaint and how to file one?",
            "What is Section 498A and what are my rights under domestic violence act?"

Question: {question}

Return ONLY one word: research, action, or both"""

    response_text = gemini_generate(prompt)

    # Parse the response — extract just the routing word
    route = response_text.lower().replace('"', '').replace("'", "")

    # Validate — default to "both" if unclear
    if route not in ("research", "action", "both"):
        # Try to find the keyword in the response
        if "research" in route:
            route = "research"
        elif "action" in route:
            route = "action"
        else:
            route = "both"

    print(f"  🧭 Supervisor → route: {route}")

    return {
        "next_step": route,
        "messages": [{"role": "supervisor", "content": f"Routed to: {route}"}]
    }


# ══════════════════════════════════════════════════════════════════
# NODE 2: RESEARCHER — RAG retrieval
# ══════════════════════════════════════════════════════════════════

def researcher_node(state: AgentState) -> dict:
    """Execute the RAG pipeline to retrieve relevant legal chunks."""

    question = state["user_question"]

    # Step 1: Generate query variants using Gemini for multi-query retrieval
    variant_prompt = f"""Generate 2 alternative phrasings of this Indian legal question for better search results.
Return ONLY the 2 variants, one per line. No numbering, no extra text.

Original: {question}"""

    variant_text = gemini_generate(variant_prompt)

    variants = [v.strip() for v in variant_text.split("\n") if v.strip()]
    all_queries = [question] + variants[:2]  # Original + up to 2 variants

    print(f"  🔬 Researcher → queries: {all_queries}")

    # Step 2: Run all queries through RAG and collect unique chunks via clean Pydantic data contracts
    all_chunks: list[dict] = []
    seen_ids = set()

    for q in all_queries:
        chunks = query_database(q, n_results=3)  # 3 per variant to avoid flooding
        for chunk in chunks:
            if chunk.id not in seen_ids:
                seen_ids.add(chunk.id)
                chunk_dict = chunk.model_dump()
                chunk_dict["query_origin"] = q
                all_chunks.append(chunk_dict)

    print(f"  📚 Researcher → retrieved {len(all_chunks)} unique chunks")

    return {
        "retrieved_chunks": all_chunks,
        "query_variants": all_queries,
        "messages": [{"role": "researcher", "content": f"Retrieved {len(all_chunks)} relevant chunks using {len(all_queries)} query variants"}]
    }


# ══════════════════════════════════════════════════════════════════
# NODE 3: ACTION — Direct tool execution
# ══════════════════════════════════════════════════════════════════

def action_node(state: AgentState) -> dict:
    """Select and execute the appropriate legal tool via native Gemini Function Calling.

    Uses Gemini's native tool-calling protocol instead of manual JSON prompt
    instructions and regex stripping. If Gemini returns a function call, we
    invoke the corresponding callable directly from TOOL_REGISTRY.
    """

    question = state["user_question"]
    tools = _build_native_tools()

    # Call Gemini with native function declarations and rate-limit retry wrapper
    response = None
    models_to_try = [MODEL, getattr(config, "FALLBACK_MODEL", "gemini-flash-latest")]
    for model_name in models_to_try:
        for attempt in range(1, 4):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=f"User legal query: {question}\nSelect the single most appropriate tool to answer this query.",
                    config=types.GenerateContentConfig(
                        tools=tools,
                        temperature=0.0,
                        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                    ),
                )
                break
            except Exception as e:
                error_str = str(e)
                is_retryable = any(code in error_str for code in ["503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED"])
                if is_retryable and attempt < 3:
                    delay_match = re.search(r'retry in ([\d\.]+)s', error_str, re.IGNORECASE)
                    wait = min(float(delay_match.group(1)) + 1.0, 60.0) if delay_match else (2 ** attempt)
                    print(f"  ⏳ Gemini API busy during tool selection on {model_name} (attempt {attempt}/3), retrying in {wait:.1f}s...")
                    time.sleep(wait)
                else:
                    break
        if response is not None:
            break

    # Extract native function call from response
    if response and response.function_calls:
        fc = response.function_calls[0]
        tool_name = fc.name
        tool_args = dict(fc.args) if fc.args else {}
    else:
        # Fallback if no function call was emitted
        tool_name = "search_legal_database"
        tool_args = {"query": question}

    # Validate tool against registry
    if tool_name not in TOOL_REGISTRY:
        tool_name = "search_legal_database"
        tool_args = {"query": question}

    print(f"  ⚡ Action (Native Tool) → calling: {tool_name}({tool_args})")

    # Execute the tool directly
    tool_fn = TOOL_REGISTRY[tool_name]["fn"]
    tool_output = tool_fn(**tool_args)

    # Normalize output to a serializable dict
    if isinstance(tool_output, str):
        tool_output_parsed = {"raw_output": tool_output}
    elif isinstance(tool_output, list):
        tool_output_parsed = {"results": tool_output}
    else:
        tool_output_parsed = tool_output

    print(f"  ✅ Action → got result from {tool_name}")

    return {
        "tool_results": [tool_output_parsed],
        "tool_name_used": tool_name,
        "messages": [{"role": "action", "content": f"Called {tool_name} with {tool_args}"}]
    }


# ══════════════════════════════════════════════════════════════════
# NODE 4: BOTH — Research + Action combined
# ══════════════════════════════════════════════════════════════════

def both_node(state: AgentState) -> dict:
    """Execute BOTH researcher and action pipelines, merge results."""

    print("  🔄 Both → running Research + Action in sequence...")

    # Run researcher first (sync)
    research_result = researcher_node(state)

    # Run action (sync)
    action_result = action_node(state)

    # Merge results
    return {
        "retrieved_chunks": research_result.get("retrieved_chunks", []),
        "query_variants": research_result.get("query_variants", []),
        "tool_results": action_result.get("tool_results", []),
        "tool_name_used": action_result.get("tool_name_used", ""),
        "messages": research_result.get("messages", []) + action_result.get("messages", [])
    }


# ══════════════════════════════════════════════════════════════════
# NODE 5: EXPLAINER — Synthesizes citizen-friendly answer
# ══════════════════════════════════════════════════════════════════

def explainer_node(state: AgentState) -> dict:
    """Synthesize all gathered information into a citizen-friendly response."""

    question = state["user_question"]
    chunks = state.get("retrieved_chunks", [])
    tool_results = state.get("tool_results", [])
    tool_name = state.get("tool_name_used", "")
    conversation_history = state.get("conversation_history", "")

    # Format research findings with statutory attribution
    research_text = "No research data available."
    if chunks:
        formatted_pieces = []
        for c in chunks[:5]:
            source = c.get("source", "Unknown") if isinstance(c, dict) else getattr(c, "source", "Unknown")
            act_title = c.get("act_title") if isinstance(c, dict) else getattr(c, "act_title", None)
            heading = c.get("section_heading") if isinstance(c, dict) else getattr(c, "section_heading", None)
            text = c.get("text", c.get("content", "")) if isinstance(c, dict) else getattr(c, "text", "")

            header = f"[{source}]"
            if act_title:
                header += f" {act_title}"
            if heading:
                header += f" - {heading}"
            formatted_pieces.append(f"### {header}\n{text}")
        research_text = "\n\n".join(formatted_pieces)

    # Format tool results
    tool_text = "No tool data available."
    if tool_results:
        tool_text = json.dumps(tool_results, indent=2, ensure_ascii=False)

    # Format conversation history section
    history_section = ""
    if conversation_history:
        history_section = f"""PREVIOUS CONVERSATION (use this for context on follow-up questions):
{conversation_history}

"""

    prompt = f"""You are Nyaya Sahayak, a friendly Indian legal advisor explaining law to a common citizen.

{history_section}USER QUESTION: {question}

LEGAL RESEARCH FINDINGS:
{research_text}

TOOL LOOKUP RESULTS (from {tool_name}):
{tool_text}

Write a clear, helpful response in English:
1. Answer the question directly in simple language
2. Cite specific section numbers and act names from the data provided
3. List practical next steps the citizen can take
4. Mention when to consult a lawyer
5. Use bullet points and clear formatting

Format with headings:
📋 Answer
📌 Key Sections
🪜 Steps You Can Take
⚖️ When to Consult a Lawyer

⚠️ DISCLAIMER: This is informational guidance only, not professional legal advice. Always consult a qualified advocate before taking legal action."""

    answer = gemini_generate(prompt)
    print("  📝 Explainer → answer generated")

    return {
        "final_answer": answer,
        "messages": [{"role": "explainer", "content": "Final answer generated"}]
    }


# ══════════════════════════════════════════════════════════════════
# LANGGRAPH WORKFLOW
# ══════════════════════════════════════════════════════════════════

workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("researcher", researcher_node)
workflow.add_node("action", action_node)
workflow.add_node("both", both_node)
workflow.add_node("explainer", explainer_node)

# Entry point
workflow.set_entry_point("supervisor")

# Conditional routing from Supervisor
workflow.add_conditional_edges(
    "supervisor",
    lambda state: state["next_step"],
    {
        "research": "researcher",
        "action": "action",
        "both": "both"
    }
)

# All paths lead to Explainer → END
workflow.add_edge("researcher", "explainer")
workflow.add_edge("action", "explainer")
workflow.add_edge("both", "explainer")
workflow.add_edge("explainer", END)

# Compile the graph
app = workflow.compile()


# ══════════════════════════════════════════════════════════════════
# PUBLIC API FUNCTIONS
# ══════════════════════════════════════════════════════════════════

async def ask(question: str, memory: ConversationMemory | None = None) -> str:
    """Run a single question through the LangGraph pipeline.

    Args:
        question: The user's legal question.
        memory: Optional ConversationMemory for multi-turn context.

    Returns:
        The final answer string from the Explainer node.
    """
    history_text = memory.format_history_for_prompt() if memory else ""

    initial_state = {
        "messages": [{"role": "user", "content": question}],
        "user_question": question,
        "conversation_history": history_text,
        "next_step": "",
        "retrieved_chunks": [],
        "query_variants": [],
        "tool_results": [],
        "tool_name_used": "",
        "final_answer": ""
    }
    result = await app.ainvoke(initial_state)
    answer = result["final_answer"]

    # Save to memory if provided
    if memory:
        memory.add_turn("user", question)
        memory.add_turn("assistant", answer)

    return answer


async def ask_with_trace(question: str, memory: ConversationMemory | None = None) -> dict:
    """Run a single question through the LangGraph pipeline.

    Like ask(), but returns the full state dict so API consumers
    can extract trace metadata (route, tool used, chunks retrieved, etc.).

    Args:
        question: The user's legal question.
        memory: Optional ConversationMemory for multi-turn context.

    Returns:
        The complete final AgentState dict.
    """
    history_text = memory.format_history_for_prompt() if memory else ""

    initial_state = {
        "messages": [{"role": "user", "content": question}],
        "user_question": question,
        "conversation_history": history_text,
        "next_step": "",
        "retrieved_chunks": [],
        "query_variants": [],
        "tool_results": [],
        "tool_name_used": "",
        "final_answer": ""
    }
    result = await app.ainvoke(initial_state)

    # Save to memory if provided
    if memory:
        memory.add_turn("user", question)
        memory.add_turn("assistant", result["final_answer"])

    return result
