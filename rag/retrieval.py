from pydantic import BaseModel, Field
import chromadb
from sentence_transformers import SentenceTransformer
from rag import config

# ── Data Contract ─────────────────────────────────────────────────
class RetrievedChunk(BaseModel):
    """Structured data contract for legal chunks retrieved from ChromaDB."""
    id: str = Field(description="Unique chunk identifier in ChromaDB")
    text: str = Field(description="Raw statutory text or section content")
    source: str = Field(default="Unknown", description="Source file name or statutory document")
    doc_type: str = Field(default="unknown", description="Type of document (e.g. act, constitution, ipc_bns_mapping)")
    act_title: str | None = Field(default=None, description="Title of the statute or act")
    section_heading: str | None = Field(default=None, description="Section heading or title")
    distance: float | None = Field(default=None, description="Cosine distance from query vector")
    metadata: dict = Field(default_factory=dict, description="All raw metadata attributes from ChromaDB")


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


def query_database(query: str, n_results: int = config.TOP_K) -> list[RetrievedChunk]:
    """
    Queries the ChromaDB vector database and returns a list of typed RetrievedChunk objects.
    """
    if not query or not query.strip():
        return []

    model = _get_model()
    collection = _get_collection()

    # Generate embedding for the query
    query_embedding = model.encode(query).tolist()
    
    # Perform similarity search
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    
    if not results['documents'] or not results['documents'][0]:
        return []

    chunks: list[RetrievedChunk] = []
    ids = results.get('ids', [[]])[0]
    docs = results['documents'][0]
    metas = results.get('metadatas', [[]])[0]
    dists = results.get('distances', [[]])[0]

    for i, doc in enumerate(docs):
        chunk_id = ids[i] if i < len(ids) else f"chunk_{i}"
        meta = metas[i] if i < len(metas) and metas[i] else {}
        dist = dists[i] if i < len(dists) else None

        chunks.append(RetrievedChunk(
            id=chunk_id,
            text=doc,
            source=meta.get('source', 'Unknown'),
            doc_type=meta.get('doc_type', 'unknown'),
            act_title=meta.get('act_title') or meta.get('ipc_title'),
            section_heading=meta.get('section_heading') or meta.get('bns_title'),
            distance=dist,
            metadata=meta,
        ))

    return chunks


def format_chunks_for_display(chunks: list[RetrievedChunk], query: str = "") -> str:
    """Format chunks into a readable string for text-based interfaces or MCP tools."""
    if not chunks:
        return "No relevant legal information found in the database."

    header = f"🔍 RAG Results for: '{query}'\n" if query else "🔍 RAG Results:\n"
    header += "=" * 50 + "\n\n"

    blocks = []
    for i, chunk in enumerate(chunks):
        title = f"[{i+1}] Source: {chunk.source}"
        if chunk.act_title:
            title += f" | {chunk.act_title}"
        if chunk.section_heading:
            title += f" ({chunk.section_heading})"
        blocks.append(f"{title}\n{chunk.text}")

    return header + ("\n" + "-" * 50 + "\n").join(blocks) + "\n" + "-" * 50


if __name__ == "__main__":
    # Test script if executed directly
    test_query = "What is the punishment for murder?"
    retrieved = query_database(test_query)
    print(f"Retrieved {len(retrieved)} structured chunks.")
    print(format_chunks_for_display(retrieved, test_query))
