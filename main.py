"""
Nyaya Sahayak — Interactive CLI

A thin CLI wrapper that uses core/pipeline.py for the LangGraph engine
and core/memory.py for conversation history.
"""
import asyncio
from core.pipeline import ask
from core.memory import ConversationMemory


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
            answer = asyncio.run(ask(question, memory=memory))
            print(f"\n📜 Nyaya Sahayak:\n{answer}\n")
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("   Please try again or rephrase your question.\n")

        print("─" * 60)


if __name__ == "__main__":
    main()
