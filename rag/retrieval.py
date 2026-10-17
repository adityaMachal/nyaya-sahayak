import chromadb
from sentence_transformers import SentenceTransformer
from rag import config

# ── Module-level singletons ───────────────────────────────────────
# Loaded once on first import/call, reused across all subsequent
# query_database() invocations.  This avoids re-loading the 384-dim
# PyTorch weights and re-opening the ChromaDB SQLite file on every
# call (previously happened 3× per user query in the multi-query
# RAG loop inside pipeline.py).

_model: SentenceTransformer | None = None
_collection: chromadb.Collection | None = None


def _get_model() -> SentenceTransformer:
    """Lazy-load the SentenceTransformer embedding model (once)."""
    global _model
    if _model is None:
        try:
            _model = SentenceTransformer(config.EMBEDDING_MODEL, device=config.DEVICE)
        except Exception:
            # Fallback to CPU if CUDA is unavailable
            _model = SentenceTransformer(config.EMBEDDING_MODEL, device='cpu')
    return _model


def _get_collection() -> chromadb.Collection:
    """Lazy-load the ChromaDB collection handle (once)."""
    global _collection
    if _collection is None:
        client = chromadb.PersistentClient(path=config.CHROMA_PERSIST_DIR)
        _collection = client.get_collection(name=config.COLLECTION_NAME)
    return _collection


def query_database(query: str, n_results: int = config.TOP_K) -> str:
    """
    Queries the ChromaDB vector database and returns a formatted string of results.
    """
    model = _get_model()
    collection = _get_collection()

    # Generate embedding for the query
    query_embedding = model.encode(query).tolist()
    
    # Perform similarity search
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    
    # Format the results into a readable string
    if not results['documents'] or not results['documents'][0]:
        return "No relevant legal information found in the database."
        
    formatted_results = f"🔍 RAG Results for: '{query}'\n"
    formatted_results += "=" * 50 + "\n\n"
    
    for i, (doc, metadata) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
        source = metadata.get('source', 'Unknown')
        formatted_results += f"[{i+1}] Source: {source}\n"
        formatted_results += f"{doc}\n"
        formatted_results += "-" * 50 + "\n"
        
    return formatted_results


if __name__ == "__main__":
    # Test script if executed directly
    test_query = "What is the punishment for murder?"
    print(query_database(test_query))
