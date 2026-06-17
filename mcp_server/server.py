import sys
from pathlib import Path

# Ensure the project root is on sys.path so 'rag' package is importable
# This is needed when fastmcp loads this file directly (e.g. via `fastmcp dev inspector`)
PROJECT_ROOT = str(Path(__file__).parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastmcp import FastMCP
from rag.retrieval import query_database

# Create the FastMCP server instance
mcp = FastMCP("NyayaSahayak_Legal_DB")

@mcp.tool()
def search_legal_database(query: str) -> str:
    """
    Search the Nyaya Sahayak legal database for Indian laws, IPC/BNS mappings,
    constitutional articles, and consumer/labor/property laws.
    
    Args:
        query: The natural language search query.
    """
    return query_database(query)

if __name__ == "__main__":
    # This runs the MCP server over stdio
    mcp.run()
