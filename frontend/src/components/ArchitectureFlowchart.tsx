"use client";

import { useState } from "react";

type NodeKey = "supervisor" | "researcher" | "action" | "explainer" | null;

interface NodeInfo {
  title: string;
  role: string;
  sla: string;
  contract: string;
  guardrail: string;
}

const NODE_DETAILS: Record<string, NodeInfo> = {
  supervisor: {
    title: "🧭 SUPERVISOR ROUTER",
    role: "Zero-shot query intent classification via Gemini 3.5 Flash",
    sla: "~0.8s execution",
    contract: "Input: { user_question } ➔ Output: { next_step: 'research' | 'action' | 'both' }",
    guardrail: "Strict single-token enum validation with graceful fallback to 'both' if query is ambiguous.",
  },
  researcher: {
    title: "📚 RESEARCHER NODE",
    role: "Multi-query variant generation and dense vector retrieval over Indian statutes",
    sla: "~5ms warm retrieval (RTX 3050 CUDA)",
    contract: "Input: { user_question, query_variants } ➔ Output: { retrieved_chunks: list[RetrievedChunk] }",
    guardrail: "O(1) Pydantic chunk ID de-duplication eliminates redundant context injection into Explainer.",
  },
  action: {
    title: "⚡ ACTION NODE",
    role: "Native Gemini Function Calling into in-memory FastMCP statutory tools",
    sla: "<1ms tool execution (in-process)",
    contract: "Input: { user_question } ➔ Output: { tool_results, tool_name_used }",
    guardrail: "Automatic Function Calling disabled; arguments strictly typed against JSON schemas.",
  },
  explainer: {
    title: "📝 EXPLAINER NODE",
    role: "Citizen-friendly legal memorandum synthesizer with statutory attribution",
    sla: "~3.0s synthesis",
    contract: "Input: { retrieved_chunks, tool_results, conversation_history } ➔ Output: { final_answer }",
    guardrail: "Mandatory Advocates Act 1961 disclaimer and anti-jurisdiction bleed prompt constraints.",
  },
};

export default function ArchitectureFlowchart() {
  const [activeNode, setActiveNode] = useState<NodeKey>(null);

  const currentInfo = activeNode ? NODE_DETAILS[activeNode] : null;

  return (
    <section id="architecture" className="relative w-full border-b border-[#C9BFB0] px-4 md:px-12 py-10 bg-[#F3EBDE]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header with Tilted Stamp */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#9E1B1B] rotate-45 inline-block" />
            <h2 className="font-editorial-serif font-bold text-2xl md:text-3xl text-[#1B1C1E] tracking-tight">
              FIG 03. LANGGRAPH ORCHESTRATION PIPELINE
            </h2>
          </div>

          <div className="rubber-stamp border-[#9E1B1B] text-[#9E1B1B] text-[11px] md:text-xs px-3 py-1 rotate-[2deg] shadow-xs select-none">
            [CIRCUIT: ZERO-LOOP DETERMINISTIC DAG]
          </div>
        </div>

        {/* Master Architectural Flowchart Frame */}
        <div className="relative border-2 border-[#1B1C1E] bg-[#FAF6F0] p-4 md:p-8 shadow-[3px_3px_0_rgba(27,28,30,0.18)]">
          {/* Corner Crosshair Marks */}
          <div className="crosshair-mark" style={{ top: "-5px", left: "-5px" }} />
          <div className="crosshair-mark" style={{ top: "-5px", right: "-5px" }} />
          <div className="crosshair-mark" style={{ bottom: "-5px", left: "-5px" }} />
          <div className="crosshair-mark" style={{ bottom: "-5px", right: "-5px" }} />

          {/* Interactive Inspection Notice Top-Right */}
          <div className="flex justify-end mb-2">
            <span className="font-tech-mono text-[10px] text-[#7A7267] tracking-wider uppercase">
              Click any node to inspect data contracts
            </span>
          </div>

          {/* FLOWCHART BODY */}
          <div className="flex flex-col items-center">
            {/* STEP 1: USER QUERY INPUT */}
            <div className="border border-[#1B1C1E] bg-[#EFE6D8] px-5 py-2 rounded-xs shadow-xs text-center z-10">
              <span className="font-tech-mono text-[11px] font-bold text-[#1B1C1E] tracking-wider uppercase block">
                User Query Input
              </span>
              <span className="font-body-serif text-xs text-[#524E48]">
                &quot;What is Section 302 IPC in BNS?&quot;
              </span>
            </div>

            {/* Connecting Line with State Annotation */}
            <div className="relative flex flex-col items-center my-1">
              <div className="w-[1.5px] h-7 bg-[#1B1C1E]" />
              <div className="font-tech-mono text-[9px] text-[#7A7267] bg-[#FAF6F0] px-2 border border-[#D8CEBF] rounded-xs my-0.5 tracking-tight">
                AgentState &#123; messages, user_question, history &#125;
              </div>
              <div className="w-[1.5px] h-3 bg-[#1B1C1E]" />
              <span className="text-[10px] text-[#1B1C1E] leading-none -mt-1">▼</span>
            </div>

            {/* STEP 2: SUPERVISOR ROUTER */}
            <button
              type="button"
              onClick={() => setActiveNode(activeNode === "supervisor" ? null : "supervisor")}
              className={`w-full max-w-md border-2 p-3.5 rounded-xs transition-all text-center cursor-pointer shadow-xs ${
                activeNode === "supervisor"
                  ? "border-[#9E1B1B] bg-[#EFE6D8] scale-[1.02]"
                  : "border-[#1B1C1E] bg-[#FAF6F0] hover:border-[#9E1B1B]"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 font-tech-mono font-bold text-xs tracking-wider text-[#1B1C1E]">
                <span>[ 🧭 SUPERVISOR ROUTER ]</span>
              </div>
              <span className="font-body-serif text-xs text-[#4A453E] block mt-0.5">
                Zero-Shot Intent Classification
              </span>
              <div className="flex justify-center gap-2 mt-2 font-tech-mono text-[10px]">
                <span className="px-2 py-0.5 bg-[#FAF6F0] border border-[#C9BFB0] rounded-xs">
                  research
                </span>
                <span className="px-2 py-0.5 bg-[#FAF6F0] border border-[#C9BFB0] rounded-xs font-semibold text-[#9E1B1B]">
                  action
                </span>
                <span className="px-2 py-0.5 bg-[#FAF6F0] border border-[#C9BFB0] rounded-xs">
                  both
                </span>
              </div>
            </button>

            {/* BRANCHING FLOW: Left (Researcher) & Right (Action) */}
            <div className="relative w-full max-w-3xl mt-4 mb-2">
              {/* Branching SVG Connector Lines */}
              <svg
                className="w-full h-12 hidden md:block"
                viewBox="0 0 600 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Horizontal split bar */}
                <path
                  d="M 150 40 L 150 10 L 450 10 L 450 40"
                  stroke="#9E1B1B"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                />
                {/* Center input drop */}
                <path d="M 300 0 L 300 10" stroke="#1B1C1E" strokeWidth="1.6" />
                {/* Down arrows */}
                <polygon points="147,38 153,38 150,45" fill="#9E1B1B" />
                <polygon points="447,38 453,38 450,45" fill="#9E1B1B" />
                {/* Labels */}
                <text x="110" y="25" fill="#9E1B1B" fontFamily="IBM Plex Mono" fontSize="9" fontWeight="600">
                  Branch Left: data flow
                </text>
                <text x="390" y="25" fill="#9E1B1B" fontFamily="IBM Plex Mono" fontSize="9" fontWeight="600">
                  Branch Right: data flow
                </text>
              </svg>

              {/* TWO PARALLEL BRANCH CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mt-1">
                {/* BRANCH A: RESEARCHER NODE */}
                <button
                  type="button"
                  onClick={() => setActiveNode(activeNode === "researcher" ? null : "researcher")}
                  className={`border-2 p-4 rounded-xs transition-all text-left cursor-pointer shadow-xs ${
                    activeNode === "researcher"
                      ? "border-[#9E1B1B] bg-[#EFE6D8] scale-[1.02]"
                      : "border-[#1B1C1E] bg-[#FAF6F0] hover:border-[#9E1B1B]"
                  }`}
                >
                  <div className="flex items-center justify-between font-tech-mono text-xs font-bold text-[#1B1C1E]">
                    <span>[ 📚 RESEARCHER NODE ]</span>
                    <span className="text-[10px] text-[#1B8E2D]">5ms</span>
                  </div>
                  <p className="font-body-serif text-xs text-[#4A453E] mt-1">
                    Multi-Query Expansion &amp; ChromaDB RAG
                  </p>

                  <div className="mt-3 space-y-1 font-tech-mono text-[10px] bg-[#EFE6D8] p-2 border border-[#C9BFB0] rounded-xs text-[#35332F]">
                    <div>• 1. Original Query Formulation</div>
                    <div>• 2. Alternative Statutory Phrasing</div>
                    <div>• 3. Procedural Context Expansion</div>
                  </div>

                  <div className="mt-2 text-right">
                    <span className="font-tech-mono text-[9.5px] text-[#7A7267] uppercase">
                      ChromaDB (RTX 3050 CUDA) ➔
                    </span>
                  </div>
                </button>

                {/* BRANCH B: ACTION NODE */}
                <button
                  type="button"
                  onClick={() => setActiveNode(activeNode === "action" ? null : "action")}
                  className={`border-2 p-4 rounded-xs transition-all text-left cursor-pointer shadow-xs ${
                    activeNode === "action"
                      ? "border-[#9E1B1B] bg-[#EFE6D8] scale-[1.02]"
                      : "border-[#1B1C1E] bg-[#FAF6F0] hover:border-[#9E1B1B]"
                  }`}
                >
                  <div className="flex items-center justify-between font-tech-mono text-xs font-bold text-[#1B1C1E]">
                    <span>[ ⚡ ACTION NODE ]</span>
                    <span className="text-[10px] text-[#1B8E2D]">&lt;1ms</span>
                  </div>
                  <p className="font-body-serif text-xs text-[#4A453E] mt-1">
                    Native FastMCP Function Calling
                  </p>

                  <div className="mt-3 space-y-1 font-tech-mono text-[10px] bg-[#EFE6D8] p-2 border border-[#C9BFB0] rounded-xs text-[#35332F]">
                    <div>&gt; search_bns_section(query=&quot;302&quot;)</div>
                    <div>&gt; check_limitation_period(case_type=...)</div>
                    <div>&gt; find_relevant_acts(situation=...)</div>
                  </div>

                  <div className="mt-2 text-right">
                    <span className="font-tech-mono text-[9.5px] text-[#7A7267] uppercase">
                      In-Memory Registry Execution ➔
                    </span>
                  </div>
                </button>
              </div>

              {/* Converging SVG Lines */}
              <svg
                className="w-full h-12 hidden md:block mt-1"
                viewBox="0 0 600 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 150 0 L 150 30 L 300 30 L 300 44"
                  stroke="#9E1B1B"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                />
                <path
                  d="M 450 0 L 450 30 L 300 30"
                  stroke="#9E1B1B"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                />
                <polygon points="297,40 303,40 300,47" fill="#9E1B1B" />
              </svg>
            </div>

            {/* STEP 3: EXPLAINER NODE */}
            <button
              type="button"
              onClick={() => setActiveNode(activeNode === "explainer" ? null : "explainer")}
              className={`w-full max-w-md border-2 p-3.5 rounded-xs transition-all text-center cursor-pointer shadow-xs ${
                activeNode === "explainer"
                  ? "border-[#9E1B1B] bg-[#EFE6D8] scale-[1.02]"
                  : "border-[#1B1C1E] bg-[#FAF6F0] hover:border-[#9E1B1B]"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 font-tech-mono font-bold text-xs tracking-wider text-[#1B1C1E]">
                <span>[ 📝 EXPLAINER NODE ]</span>
              </div>
              <span className="font-body-serif text-xs text-[#4A453E] block mt-0.5">
                Citizen-Friendly Legal Synthesis &amp; Attribution
              </span>
              <div className="font-tech-mono text-[10px] text-[#7A7267] mt-1.5">
                Merges RAG Chunks + FastMCP Tool Results + Mandatory Disclaimers
              </div>
            </button>

            {/* FINAL OUTPUT ARROW & RESULT */}
            <div className="flex flex-col items-center my-2">
              <span className="text-xs text-[#1B1C1E]">▼</span>
              <div className="mt-1 border border-[#1B1C1E] bg-[#1F2123] text-[#F3EBDE] font-tech-mono text-xs px-4 py-2 rounded-xs shadow-xs text-center">
                <span>Output: Structured Citizen Legal Memo</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC NODE INSPECTION PANEL (when a node is clicked) */}
          {currentInfo && (
            <div className="mt-6 border-t-2 border-[#9E1B1B] bg-[#EFE6D8] p-4 rounded-xs transition-all animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C9BFB0] pb-2">
                <span className="font-tech-mono font-bold text-xs text-[#9E1B1B]">
                  {currentInfo.title}
                </span>
                <span className="font-tech-mono text-[10.5px] px-2 py-0.5 bg-[#FAF6F0] border border-[#C9BFB0] rounded-xs font-semibold text-[#1B8E2D]">
                  {currentInfo.sla}
                </span>
              </div>
              <p className="font-body-serif text-xs text-[#1B1C1E] mt-2 font-medium">
                <strong>Role:</strong> {currentInfo.role}
              </p>
              <p className="font-tech-mono text-[11px] text-[#35332F] mt-1 bg-[#FAF6F0] p-2 border border-[#D8CEBF] rounded-xs">
                <strong>Data Contract:</strong> {currentInfo.contract}
              </p>
              <p className="font-body-serif text-xs text-[#524E48] mt-1.5">
                <strong>Production Guardrail:</strong> {currentInfo.guardrail}
              </p>
            </div>
          )}

          {/* Technical Millimeter Measurement Ruler along the bottom frame */}
          <div className="mt-6 pt-3 border-t border-[#C9BFB0] flex items-center justify-between text-[#7A7267]">
            <span className="font-tech-mono text-[9px] uppercase tracking-wider">
              [CIRCUIT ZERO-LOOP DETERMINISTIC DAG]
            </span>
            {/* SVG Millimeter Ruler Ticks */}
            <div className="w-1/2 h-3 hidden sm:flex items-end justify-between overflow-hidden opacity-60">
              {Array.from({ length: 40 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-[1px] bg-[#3B3732] ${
                    i % 5 === 0 ? "h-3" : "h-1.5"
                  }`}
                />
              ))}
            </div>
            <span className="font-tech-mono text-[9px]">SCALE: 1:1 STATEGRAPH</span>
          </div>
        </div>
      </div>
    </section>
  );
}
