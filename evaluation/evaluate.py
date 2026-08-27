"""
Evaluation script to run test queries through the Nyaya Sahayak pipeline.
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

from main import app

async def evaluate_queries():
    queries_file = Path(__file__).parent / "test_queries.json"
    results_file = Path(__file__).parent / "evaluation_run_results.json"
    
    with open(queries_file, "r") as f:
        queries = json.load(f)
        
    results = []
    
    print("🚀 Starting Evaluation of 10 Queries...\n")
    
    for q in queries:
        print(f"[{q['id']}/10] Testing: {q['question']}")
        
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
            
            result_record = {
                "id": q["id"],
                "question": q["question"],
                "category": q["category"],
                "expected_source": q["expected_source"],
                "route_taken": final_state.get("next_step"),
                "tool_used": final_state.get("tool_name_used"),
                "chunks_retrieved": len(final_state.get("retrieved_chunks", [])),
                "answer": final_state.get("final_answer"),
                "error": None
            }
            print(f"  ✅ Route: {result_record['route_taken']} | Chunks: {result_record['chunks_retrieved']} | Tool: {result_record['tool_used']}")
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            result_record = {
                "id": q["id"],
                "question": q["question"],
                "error": str(e)
            }
            
        results.append(result_record)
        
    with open(results_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print(f"\n✅ Evaluation complete. Results saved to {results_file}")
    print("Next step: Manually review the answers and fill out results.md!")

if __name__ == "__main__":
    asyncio.run(evaluate_queries())
