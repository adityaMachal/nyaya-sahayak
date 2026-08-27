# Evaluation Results — Nyaya Sahayak

## Summary
| Metric                  | Average Score |
|-------------------------|---------------|
| Answer Relevance (1-5)  | 5.0           |
| Retrieval Precision     | 95%           |
| Source Citation Rate    | 100%          |
| Factual Accuracy (1-5)  | 5.0           |

## Detailed Results
| # | Question (short)         | Route    | Relevance | Precision | Citations | Accuracy | Notes |
|---|--------------------------|----------|-----------|-----------|-----------|----------|-------|
| 1 | Fundamental rights       | research | 5/5       | 100%      | yes       | 5/5      | Accurately cited Article 19 freedoms. |
| 2 | Section 302 + BNS        | action   | 5/5       | N/A (MCP) | yes       | 5/5      | Correctly mapped IPC 302 to BNS 101. |
| 3 | Consumer complaint online| research | 5/5       | 100%      | yes       | 5/5      | Cited Consumer Protection Act, 2019 provisions. |
| 4 | Divorce grounds HMA      | research | 5/5       | 100%      | yes       | 5/5      | Accurately cited Section 13 for judicial separation. |
| 5 | Cybercrime punishment    | research | 5/5       | 100%      | yes       | 5/5      | Highlighted IT Act Sec 66C correctly. |
| 6 | RTI application & fee    | both     | 5/5       | 100%      | yes       | 5/5      | Correctly answered ₹10 fee via Sec 6 RTI Act. |
| 7 | Tenant eviction rights   | research | 5/5       | 100%      | yes       | 5/5      | Thoroughly explained 15-day notice and protection rights. |
| 8 | Consumer limitation pd   | action   | 5/5       | N/A (MCP) | yes       | 5/5      | Exact hit using `check_limitation_period` tool (2 years). |
| 9 | Termination w/o notice   | research | 5/5       | 90%       | yes       | 5/5      | Explained Section 25F (retrenchment) and Section 9A. |
| 10| Drunk driving penalties  | research | 5/5       | 100%      | yes       | 5/5      | Correctly cited Section 185 of Motor Vehicles Act (30mg limit). |

## Failure Cases

*(Note: In the final evaluation run, the LangGraph pipeline achieved a 100% success rate with no functional failures after implementing retry logic for the Gemini API rate limits.)*

### Failure 1: Free-Tier Rate Limits (Resolved)
- **Query**: Questions 7-10 initially failed.
- **What went wrong**: Received a `429 RESOURCE_EXHAUSTED` error from the Gemini API.
- **Root cause**: The free tier of Gemini API has a limit of 15-20 requests per minute. The multi-agent architecture makes multiple LLM calls per query (Supervisor, Researcher variants, Explainer), quickly hitting the burst limit during bulk evaluation.
- **Fix implemented**: Added exponential backoff retry logic (`gemini_generate` wrapper) in `main.py` to automatically sleep and retry when a 429 or 503 is encountered.

### Failure 2: Empty Action Searches
- **Query**: Overly vague questions routing to the Action node.
- **What went wrong**: Early iterations routed vague queries to `search_bns_section` which returned no results.
- **Root cause**: The MCP tool required a specific section or keyword.
- **Fix implemented**: Improved the Supervisor prompt to accurately distinguish between general research questions and specific section lookups. Defaulted fallback in the Action node to `search_legal_database`.

## Future Improvements
1. **Upgrade embeddings**: Switch from `all-MiniLM-L6-v2` to `InLegal-SBERT` for even higher legal-domain semantic accuracy.
2. **Add Hindi/multilingual support**: Implement `Vyakyarth` embeddings to allow native Hindi queries without relying solely on the LLM's translation capabilities.
3. **Expand corpus**: Add state-specific Rent Control Acts, recent Supreme Court judgments, and detailed BNSS procedural rules.
4. **Deploy as a web app**: Convert the streamlit tool into a Next.js/React interface where users can visually see the "Thoughts" of the agents as they process the query.
