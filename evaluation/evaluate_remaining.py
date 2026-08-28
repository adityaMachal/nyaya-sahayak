"""
Evaluation script to resume testing for queries that failed (e.g., due to rate limits).
It reads the existing results, finds the ones with errors, retries them, and updates the file.
"""
import asyncio
import json
import os
import sys
from pathlib import Path

# Add project root to sys.path so we can import from main
PROJECT_ROOT = str(Path(__file__).parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.pipeline import app

async def evaluate_remaining():
    results_file = Path(__file__).parent / "evaluation_run_results.json"
    queries_file = Path(__file__).parent / "test_queries.json"
    
    # Load original queries to get the full metadata
    with open(queries_file, "r") as f:
        all_queries = {q["id"]: q for q in json.load(f)}

    # Load the results generated so far
    if not results_file.exists():
        print(f"❌ Could not find {results_file}. Run evaluate.py first.")
        return

    with open(results_file, "r") as f:
        results = json.load(f)
        
    # Find which ones need to be retried
    to_retry = [r for r in results if r.get("error") is not None]
    
    if not to_retry:
        print("✅ No failed queries found! All 10 queries succeeded.")
        return
        
    print(f"🚀 Found {len(to_retry)} failed queries. Resuming evaluation...\n")
    
    for result_record in to_retry:
        q_id = result_record["id"]
        q = all_queries[q_id]
        
        print(f"[{q_id}/10] Retrying: {q['question']}")
        
        initial_state = {
            "messages": [{"role": "user", "content": q['question']}],
            "user_question": q['question'],
            "next_step": "",
            "retrieved_chunks": [],
            "query_variants": [],
            "tool_results": [],
            "tool_name_used": "",
            "final_answer": ""
        }
        
        try:
            # Run the LangGraph pipeline
            final_state = await app.ainvoke(initial_state)
            
            # Update the record with the successful data
            result_record.update({
                "category": q["category"],
                "expected_source": q["expected_source"],
                "route_taken": final_state.get("next_step"),
                "tool_used": final_state.get("tool_name_used"),
                "chunks_retrieved": len(final_state.get("retrieved_chunks", [])),
                "answer": final_state.get("final_answer"),
                "error": None
            })
            print(f"  ✅ Route: {result_record['route_taken']} | Chunks: {result_record['chunks_retrieved']} | Tool: {result_record['tool_used']}")
            
        except Exception as e:
            print(f"  ❌ Error again: {str(e)}")
            result_record["error"] = str(e)
            
        # Save incrementally so we don't lose progress if it rate limits again
        with open(results_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"\n✅ Resume evaluation complete. Results updated in {results_file}")

if __name__ == "__main__":
    asyncio.run(evaluate_remaining())
