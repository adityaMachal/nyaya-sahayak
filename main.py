"""
Nyaya Sahayak — Interactive CLI & Application Entrypoint

A thin CLI wrapper that uses core/pipeline.py for the LangGraph engine
and core/memory.py for conversation history. Also exports the FastAPI
application instance for ASGI server runners (e.g. uvicorn main:app).
"""
import asyncio
import concurrent.futures
from core.pipeline import ask
from core.memory import ConversationMemory

# Re-export FastAPI app for convenience (enables: uvicorn main:app)
from api.server import app  # noqa: F401


def _run_coroutine(coro):
    """Run an async coroutine safely, even inside an already running event loop."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(asyncio.run, coro).result()
    return asyncio.run(coro)


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

    memory = ConversationMemory()
    print(f"  📝 Session: {memory.session_id[:8]}...\n")

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
            answer = _run_coroutine(ask(question, memory=memory))
            print(f"\n📜 Nyaya Sahayak:\n{answer}\n")
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("   Please try again or rephrase your question.\n")

        print("─" * 60)


if __name__ == "__main__":
    main()
