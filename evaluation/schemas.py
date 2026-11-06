"""
Pydantic Schemas for RAG Triad Evaluation (LLM-as-a-Judge)

Defines strict data contracts for:
- Atomic Claim Decomposition (Zero-Hallucination Faithfulness)
- Answer Relevance & Question-Answer Alignment
- Context Precision & Retrieval Quality
- Composite Scorecard & Benchmark Reporting
"""

from typing import Literal
from pydantic import BaseModel, Field


class AtomicClaim(BaseModel):
    """An isolated factual, statutory, or procedural assertion extracted from an answer."""
    claim_id: int
    claim_text: str = Field(
        ...,
        description="Single, isolated factual assertion made in the legal memorandum."
    )
    is_supported: bool = Field(
        ...,
        description="True if the claim is strictly verified by the retrieved context."
    )
    evidence_quote: str | None = Field(
        default=None,
        description="Exact verbatim text snippet from the retrieved context proving the claim."
    )
    citation_source: str | None = Field(
        default=None,
        description="Source statute or document containing the supporting snippet."
    )


class FaithfulnessAudit(BaseModel):
    """Atomic-claim evaluation of factual faithfulness and absence of hallucinations."""
    claims: list[AtomicClaim] = Field(default_factory=list)
    total_claims: int = 0
    supported_claims: int = 0
    faithfulness_score: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Ratio of supported claims to total claims (1.0 = zero hallucinations)."
    )
    audit_summary: str = Field(
        default="",
        description="Detailed evaluation summary of factual fidelity to statutory sources."
    )


class RelevanceAudit(BaseModel):
    """Evaluation of whether the answer directly and completely addresses the citizen inquiry."""
    score: float = Field(..., ge=0.0, le=1.0, description="Overall answer relevance score.")
    directness_score: float = Field(..., ge=0.0, le=1.0, description="Did it answer without evasion or fluff?")
    completeness_score: float = Field(..., ge=0.0, le=1.0, description="Did it address all specific constraints (deadlines, sections)?")
    reasoning: str = Field(..., description="Judicial explanation for the relevance score.")


class ContextPrecisionAudit(BaseModel):
    """Evaluation of vector retrieval quality and statutory signal-to-noise ratio."""
    score: float = Field(..., ge=0.0, le=1.0, description="Rank-aware precision of retrieved chunks.")
    total_retrieved: int = Field(default=0, description="Total chunks retrieved by ChromaDB.")
    relevant_chunks_count: int = Field(default=0, description="Number of chunks directly relevant to query.")
    top_chunk_relevant: bool = Field(default=True, description="True if Rank 1 chunk is directly relevant.")
    reasoning: str = Field(..., description="Evaluation of retrieval relevance and rank utility.")


class RAGTriadScore(BaseModel):
    """Complete RAG Triad assessment for a single legal consultation turn."""
    query_id: int
    question: str
    faithfulness: FaithfulnessAudit
    answer_relevance: RelevanceAudit
    context_precision: ContextPrecisionAudit
    composite_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Weighted composite: (Faithfulness * 0.45) + (Relevance * 0.35) + (Precision * 0.20)"
    )
    verdict: Literal["PASS", "FAIL", "NEEDS_REVIEW"]


class BenchmarkSummary(BaseModel):
    """Aggregate benchmark results across the entire test dataset."""
    timestamp: str
    total_queries: int
    passed_queries: int
    failed_queries: int
    pass_rate: float
    mean_faithfulness: float
    mean_relevance: float
    mean_context_precision: float
    mean_composite_score: float
    results: list[dict] = Field(default_factory=list)
