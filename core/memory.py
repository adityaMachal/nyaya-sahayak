"""
Conversation memory manager using SQLite.

Provides session-based multi-turn chat history storage and retrieval.
Each session is identified by a UUID and stores alternating user/assistant turns.
"""
import sqlite3
import uuid
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent.parent / "data" / "conversations.db"


class ConversationMemory:
    """Manages multi-turn conversation history per session."""

    def __init__(self, session_id: str | None = None):
        self.session_id = session_id or str(uuid.uuid4())
        self.db_path = DB_PATH
        self._init_db()

    def _init_db(self):
        """Create the conversations table if it doesn't exist."""
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_session
                ON conversations(session_id)
            """)

    def add_turn(self, role: str, content: str):
        """Add a user or assistant message to the session."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO conversations (session_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
                (self.session_id, role, content, datetime.now().isoformat())
            )

    def get_history(self, limit: int = 10) -> list[dict]:
        """Get the last `limit` turns for this session, in chronological order."""
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT role, content, timestamp FROM conversations WHERE session_id = ? ORDER BY id DESC LIMIT ?",
                (self.session_id, limit)
            ).fetchall()
        # Reverse to chronological order (DESC query returns newest first)
        return [{"role": r[0], "content": r[1], "timestamp": r[2]} for r in reversed(rows)]

    def format_history_for_prompt(self, limit: int = 6) -> str:
        """Format recent history as a string for LLM prompt injection.

        Returns a condensed version of the conversation suitable for
        including in the Explainer node's system prompt, so it can
        understand follow-up questions in context.
        """
        history = self.get_history(limit)
        if not history:
            return ""
        lines = []
        for turn in history:
            prefix = "User" if turn["role"] == "user" else "Nyaya Sahayak"
            content = turn["content"]
            # Truncate long assistant answers to save tokens
            if turn["role"] == "assistant" and len(content) > 500:
                content = content[:500] + "..."
            lines.append(f"{prefix}: {content}")
        return "\n".join(lines)

    def clear(self):
        """Clear all history for this session."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "DELETE FROM conversations WHERE session_id = ?",
                (self.session_id,)
            )

    @staticmethod
    def list_sessions() -> list[dict]:
        """List all conversation sessions with metadata."""
        if not DB_PATH.exists():
            return []
        with sqlite3.connect(DB_PATH) as conn:
            rows = conn.execute("""
                SELECT session_id, MIN(timestamp), MAX(timestamp), COUNT(*)
                FROM conversations
                GROUP BY session_id
                ORDER BY MAX(timestamp) DESC
            """).fetchall()
        return [
            {"session_id": r[0], "created_at": r[1], "last_active": r[2], "turn_count": r[3]}
            for r in rows
        ]
