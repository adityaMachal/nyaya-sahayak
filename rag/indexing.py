import json
import re
import time
from pathlib import Path
from sentence_transformers import SentenceTransformer
import chromadb
from rag import config

def load_json_documents(filepath: Path) -> list[dict]:
    """Load a JSON file where each entry becomes one chunk."""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    chunks = []
    doc_type = filepath.stem
    
    for item in data:
        if doc_type == "ipc_bns_mapping":
            text = f"IPC Section {item['ipc_section']} / BNS Section {item.get('bns_section', 'N/A')}: {item['ipc_title']}\n"
            text += f"Description: {item['ipc_description']}\n"
            text += f"Punishment: {item['ipc_punishment']}"
            chunk_id = f"ipc_bns_{item['ipc_section']}"
            
        elif doc_type == "constitution":
            text = f"Article {item['article_number']}: {item['title']}\n{item['text']}"
            chunk_id = f"const_{item['article_number']}"
            
        else:
            continue
            
        metadata = {k: str(v) for k, v in item.items()} # Chroma requires string, int, float or bool values
        metadata["source"] = filepath.name
        metadata["doc_type"] = doc_type
        
        chunks.append({
            "id": chunk_id,
            "text": text,
            "metadata": metadata
        })
        
    return chunks

def load_and_chunk_markdown(filepath: Path) -> list[dict]:
    """Load a markdown file and split by ## headings (structural chunking)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract the main title (Level 1 heading)
    title_match = re.search(r'^#\s+(.+)$', content, flags=re.MULTILINE)
    act_title = title_match.group(1).strip() if title_match else filepath.stem.replace('_', ' ').title()
    
    # Split by level 2 headings
    sections = re.split(r'^##\s+', content, flags=re.MULTILINE)
    
    chunks = []
    # Skip the first split if it's just preamble before the first ## heading
    for i, section in enumerate(sections):
        if not section.strip() or i == 0 and not content.startswith('##'):
            continue
            
        # The first line of the split is the heading, the rest is content
        lines = section.split('\n', 1)
        heading = lines[0].strip()
        body = lines[1].strip() if len(lines) > 1 else ""
        
        # We prepend the act title to give context to this specific section
        text = f"Act: {act_title}\nHeading: {heading}\n\n{body}"
        
        # Create a safe ID
        safe_heading = re.sub(r'[^a-zA-Z0-9]', '_', heading)[:30]
        chunk_id = f"{filepath.stem}_{i}_{safe_heading}"
        
        metadata = {
            "source": filepath.name,
            "doc_type": "act",
            "act_title": act_title,
            "section_heading": heading
        }
        
        chunks.append({
            "id": chunk_id,
            "text": text,
            "metadata": metadata
        })
        
    return chunks

def build_index():
    print(f"🚀 Initializing SentenceTransformer on {config.DEVICE.upper()}...")
    try:
        model = SentenceTransformer(config.EMBEDDING_MODEL, device=config.DEVICE)
    except Exception as e:
        print(f"⚠️ Failed to init on {config.DEVICE}, falling back to CPU. Error: {e}")
        model = SentenceTransformer(config.EMBEDDING_MODEL, device='cpu')
    
    print(f"📂 Initializing ChromaDB at {config.CHROMA_PERSIST_DIR}...")
    client = chromadb.PersistentClient(path=config.CHROMA_PERSIST_DIR)
    
    # Recreate collection to ensure it's fresh
    try:
        client.delete_collection(name=config.COLLECTION_NAME)
    except Exception:
        pass
        
    collection = client.create_collection(name=config.COLLECTION_NAME)
    
    all_chunks = []
    
    print("📖 Loading and chunking documents...")
    raw_dir = Path(config.RAW_DATA_DIR)
    
    for file_path in raw_dir.glob("*"):
        if file_path.suffix == '.json':
            chunks = load_json_documents(file_path)
            all_chunks.extend(chunks)
            print(f"  ✓ {file_path.name}: {len(chunks)} chunks (JSON)")
            
        elif file_path.suffix == '.md' and file_path.name != "SOURCES.md":
            chunks = load_and_chunk_markdown(file_path)
            all_chunks.extend(chunks)
            print(f"  ✓ {file_path.name}: {len(chunks)} chunks (Markdown Structure)")

    if not all_chunks:
        print("❌ No chunks generated. Are the raw files present?")
        return

    print(f"🧠 Embedding {len(all_chunks)} chunks...")
    start_time = time.time()
    
    texts = [c["text"] for c in all_chunks]
    ids = [c["id"] for c in all_chunks]
    metadatas = [c["metadata"] for c in all_chunks]
    
    # Generate embeddings in batch
    embeddings = model.encode(texts, batch_size=32, show_progress_bar=True)
    embeddings_list = embeddings.tolist()
    
    print(f"💾 Saving to ChromaDB...")
    # Upsert in batches to avoid max limit per request
    batch_size = 100
    for i in range(0, len(all_chunks), batch_size):
        end = min(i + batch_size, len(all_chunks))
        collection.upsert(
            ids=ids[i:end],
            embeddings=embeddings_list[i:end],
            documents=texts[i:end],
            metadatas=metadatas[i:end]
        )
        
    elapsed = time.time() - start_time
    print(f"✅ Successfully indexed {len(all_chunks)} chunks in {elapsed:.2f} seconds!")

if __name__ == "__main__":
    build_index()
