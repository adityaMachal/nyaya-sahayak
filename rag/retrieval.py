import chromadb
from sentence_transformers import SentenceTransformer
from rag import config

def query_database(query: str, n_results: int = config.TOP_K) -> str:
    """
    Queries the ChromaDB vector database and returns a formatted string of results.
    """
    try:
        # Initialize embedding model and DB client
        model = SentenceTransformer(config.EMBEDDING_MODEL, device=config.DEVICE)
    except Exception:
        # Fallback to CPU if CUDA fails
        model = SentenceTransformer(config.EMBEDDING_MODEL, device='cpu')
        
    client = chromadb.PersistentClient(path=config.CHROMA_PERSIST_DIR)
    collection = client.get_collection(name=config.COLLECTION_NAME)
    
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
