"""
Nyaya Sahayak — Multi-Agent Legal Assistant
Phase 5: LangGraph StateGraph with 4 routing nodes + MCP Client over stdio

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
import sys
import time
from pathlib import Path
from typing import Annotated, Literal, TypedDict

import operator
from dotenv import load_dotenv
from google import genai
from langgraph.graph import END, StateGraph

# ── Environment Setup ──────────────────────────────────────────────
load_dotenv()

PROJECT_ROOT = str(Path(__file__).parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from rag.retrieval import query_database
from rag import config


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
    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=prompt,
            )
            return response.text.strip()
        except Exception as e:
            error_str = str(e)
            is_retryable = any(code in error_str for code in ["503", "429", "UNAVAILABLE", "RESOURCE_EXHAUSTED"])
            if is_retryable and attempt < max_retries:
                wait = 2 ** attempt  # 2s, 4s
                print(f"  ⏳ Gemini API busy (attempt {attempt}/{max_retries}), retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise


# ── Agent State ────────────────────────────────────────────────────

class AgentState(TypedDict):
    # Accumulates all messages (user query, agent thoughts, tool results)
    messages: Annotated[list, operator.add]

    # The original user question (never changes)
    user_question: str

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

    # Step 2: Run all queries through RAG and collect unique chunks
    all_chunks = []
    seen_content = set()

    for q in all_queries:
        result_text = query_database(q, n_results=3)  # 3 per variant to avoid flooding
        # Parse the formatted output back into chunks
        if "No relevant legal information found" not in result_text:
            # Split by separator and extract chunks
            sections = result_text.split("-" * 50)
            for section in sections:
                section = section.strip()
                if section and "RAG Results for:" not in section and "=" * 50 not in section:
                    # De-duplicate by content hash
                    content_hash = hash(section[:200])
                    if content_hash not in seen_content:
                        seen_content.add(content_hash)
                        all_chunks.append({
                            "content": section,
                            "query": q
                        })

    print(f"  📚 Researcher → retrieved {len(all_chunks)} unique chunks")

    return {
        "retrieved_chunks": all_chunks,
        "query_variants": all_queries,
        "messages": [{"role": "researcher", "content": f"Retrieved {len(all_chunks)} relevant chunks using {len(all_queries)} query variants"}]
    }


# ══════════════════════════════════════════════════════════════════
# NODE 3: ACTION — MCP Client over stdio
# ══════════════════════════════════════════════════════════════════

async def action_node(state: AgentState) -> dict:
    """Connect to FastMCP server via stdio and execute the appropriate tool."""

    from mcp.client.stdio import stdio_client, StdioServerParameters
    from mcp.client.session import ClientSession

    question = state["user_question"]

    # Start MCP server as a subprocess
    server_params = StdioServerParameters(
        command=sys.executable,  # Use the same Python interpreter
        args=["-m", "mcp_server.server"],
        cwd=PROJECT_ROOT,
    )

    async with stdio_client(server_params) as streams:
        async with ClientSession(*streams) as session:
            await session.initialize()

            # Step 1: Fetch available tools from the MCP server
            tools_response = await session.list_tools()
            tools = tools_response.tools

            # Build a description of available tools for Gemini
            tool_descriptions = []
            for tool in tools:
                params = json.dumps(tool.inputSchema.get("properties", {}), indent=2)
                tool_descriptions.append(
                    f"Tool: {tool.name}\n"
                    f"Description: {tool.description}\n"
                    f"Parameters: {params}"
                )

            tools_text = "\n---\n".join(tool_descriptions)

            # Step 2: Ask Gemini which tool to call and with what arguments
            tool_selection_prompt = f"""You are an AI that selects the right legal tool to answer a question.

Available tools:
{tools_text}

User question: {question}

Respond in this EXACT JSON format (no markdown, no code fences):
{{"tool_name": "name_of_tool", "arguments": {{"param_name": "param_value"}}}}

Pick the MOST relevant tool. If the question mentions a specific IPC/BNS section number, use "search_bns_section".
If it asks about time limits or deadlines, use "check_limitation_period".
If it describes a situation, use "find_relevant_acts".
For general legal searches, use "search_legal_database"."""

            decision_text = gemini_generate(tool_selection_prompt)
            # Clean up any markdown code fences
            decision_text = decision_text.replace("```json", "").replace("```", "").strip()

            try:
                decision = json.loads(decision_text)
            except json.JSONDecodeError:
                # Fallback: use search_legal_database with the question
                decision = {
                    "tool_name": "search_legal_database",
                    "arguments": {"query": question}
                }

            tool_name = decision["tool_name"]
            tool_args = decision.get("arguments", {})

            print(f"  ⚡ Action → calling MCP tool: {tool_name}({tool_args})")

            # Step 3: Execute the tool via MCP
            result = await session.call_tool(tool_name, arguments=tool_args)

            # Extract the text content from the result
            tool_output = ""
            for content_block in result.content:
                if hasattr(content_block, "text"):
                    tool_output += content_block.text

            # Try to parse as JSON for structured results
            try:
                tool_output_parsed = json.loads(tool_output)
            except (json.JSONDecodeError, TypeError):
                tool_output_parsed = {"raw_output": tool_output}

            print(f"  ✅ Action → got result from {tool_name}")

            return {
                "tool_results": [tool_output_parsed],
                "tool_name_used": tool_name,
                "messages": [{"role": "action", "content": f"Called {tool_name} with {tool_args}"}]
            }


# ══════════════════════════════════════════════════════════════════
# NODE 4: BOTH — Research + Action combined
# ══════════════════════════════════════════════════════════════════

async def both_node(state: AgentState) -> dict:
    """Execute BOTH researcher and action pipelines, merge results."""

    print("  🔄 Both → running Research + Action in sequence...")

    # Run researcher first (sync)
    research_result = researcher_node(state)

    # Run action (async)
    action_result = await action_node(state)

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

    # Format research findings
    research_text = "No research data available."
    if chunks:
        research_text = "\n\n".join([c["content"] for c in chunks[:5]])

    # Format tool results
    tool_text = "No tool data available."
    if tool_results:
        tool_text = json.dumps(tool_results, indent=2, ensure_ascii=False)

    prompt = f"""You are Nyaya Sahayak, a friendly Indian legal advisor explaining law to a common citizen.

USER QUESTION: {question}

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
# INTERACTIVE CLI
# ══════════════════════════════════════════════════════════════════

async def ask(question: str) -> str:
    """Run a single question through the LangGraph pipeline."""
    initial_state = {
        "messages": [{"role": "user", "content": question}],
        "user_question": question,
        "next_step": "",
        "retrieved_chunks": [],
        "query_variants": [],
        "tool_results": [],
        "tool_name_used": "",
        "final_answer": ""
    }
    result = await app.ainvoke(initial_state)
    return result["final_answer"]


def main():
    print()
    print("╔══════════════════════════════════════════════════╗")
    print("║  🏛️  Nyaya Sahayak — न्याय सहायक                 ║")
    print("║  Indian Law AI Assistant                        ║")
    print("║  Powered by RAG + MCP + LangGraph               ║")
    print("╚══════════════════════════════════════════════════╝")
    print()
    print("  Ask any question about Indian law.")
    print("  Type 'quit' to exit.\n")

    while True:
        try:
            question = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nGoodbye! 🙏")
            break

        if question.lower() in ("quit", "exit", "q"):
            print("\nGoodbye! Remember: always consult a real advocate for legal matters. 🙏")
            break
        if not question:
            continue

        print(f"\n  🤔 Processing: \"{question}\"\n")

        try:
            answer = asyncio.run(ask(question))
            print(f"\n📜 Nyaya Sahayak:\n{answer}\n")
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("   Please try again or rephrase your question.\n")

        print("─" * 60)


if __name__ == "__main__":
    main()
