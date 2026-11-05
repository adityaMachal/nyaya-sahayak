import os
from pathlib import Path

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
CHROMA_PERSIST_DIR = str(PROJECT_ROOT / "data" / "chroma_db")

# ChromaDB
COLLECTION_NAME = "nyaya_sahayak_laws"

# Embedding
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
DEVICE = "cuda"  # Leverages RTX 3050 (fallback to cpu if unavailable)

# Retrieval
TOP_K = 5        # Number of chunks to retrieve per query

# LLM
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-3.5-flash")
FALLBACK_MODEL = "gemini-flash-latest"
