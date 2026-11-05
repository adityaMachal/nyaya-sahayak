"use client";

export default function CapabilitiesGrid() {
  return (
    <section id="agents" className="relative w-full border-b border-[#C9BFB0] px-4 md:px-12 py-10 bg-[#F3EBDE]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 bg-[#9E1B1B] rotate-45 inline-block" />
          <h2 className="font-editorial-serif font-bold text-2xl md:text-3xl text-[#1B1C1E] tracking-tight">
            FIG 04. STATUTORY INTELLIGENCE MODULES
          </h2>
        </div>

        {/* 2x2 Technical Dossier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* CARD 1: IPC-to-BNS Statutory Bridge */}
          <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-5 shadow-[2px_2px_0_rgba(27,28,30,0.14)] hover:border-[#9E1B1B] transition-colors flex flex-col justify-between group">
            {/* Corner Brackets */}
            <span className="absolute top-1 left-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌜
            </span>
            <span className="absolute top-1 right-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌝
            </span>
            <span className="absolute bottom-1 left-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌞
            </span>
            <span className="absolute bottom-1 right-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌟
            </span>

            <div>
              <h3 className="font-editorial-serif font-bold text-xl text-[#1B1C1E]">
                IPC-to-BNS Statutory Bridge
              </h3>
              <p className="font-tech-mono text-[11px] text-[#7A7267] mt-0.5">
                Historical (IPC 420 ➔ BNS 318) Transformation
              </p>

              {/* Graphic: Side-by-side IPC to BNS transition box */}
              <div className="mt-4 p-3 bg-[#EFE6D8] border border-[#C9BFB0] rounded-xs flex items-center justify-center gap-3">
                <div className="border border-[#1B1C1E] bg-[#FAF6F0] px-3 py-1.5 font-tech-mono font-bold text-sm text-[#1B1C1E] shadow-xs">
                  IPC 420
                </div>
                <div className="flex items-center gap-1 text-[#9E1B1B] font-bold">
                  <span className="w-8 h-[1.5px] bg-[#9E1B1B]" />
                  <span>➔</span>
                </div>
                <div className="border border-[#9E1B1B] bg-[#FAF6F0] px-3 py-1.5 font-tech-mono font-bold text-sm text-[#9E1B1B] shadow-xs">
                  BNS 318
                </div>
              </div>

              <p className="font-body-serif text-xs text-[#35332F] mt-3 leading-relaxed">
                Deterministic cross-referencing between historical IPC provisions
                and the new Bharatiya Nyaya Sanhita (2023). Maps section renumbering,
                procedural updates, and penalty schedules with zero LLM hallucination.
              </p>
            </div>

            {/* Bottom Tag & Index */}
            <div className="mt-4 pt-2 border-t border-[#D8CEBF] flex items-center justify-between text-[10px] font-tech-mono text-[#7A7267]">
              <span>FastMCP: search_bns_section</span>
              <span className="font-bold text-[#1B1C1E]">[01]</span>
            </div>
          </div>

          {/* CARD 2: Deterministic Limitation Calculator */}
          <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-5 shadow-[2px_2px_0_rgba(27,28,30,0.14)] hover:border-[#9E1B1B] transition-colors flex flex-col justify-between group">
            <span className="absolute top-1 left-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌜
            </span>
            <span className="absolute top-1 right-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌝
            </span>
            <span className="absolute bottom-1 left-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌞
            </span>
            <span className="absolute bottom-1 right-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌟
            </span>

            <div>
              <h3 className="font-editorial-serif font-bold text-xl text-[#1B1C1E]">
                Deterministic Limitation Calculator
              </h3>
              <p className="font-tech-mono text-[11px] text-[#7A7267] mt-0.5">
                Statute of Limitations (Limitation Act 1963 &amp; NI Act S.138)
              </p>

              {/* Graphic: Statute deadline boxes */}
              <div className="mt-4 p-3 bg-[#EFE6D8] border border-[#C9BFB0] rounded-xs grid grid-cols-2 gap-2 text-center font-tech-mono text-xs">
                <div className="border border-[#1B1C1E] bg-[#FAF6F0] p-2">
                  <span className="font-bold block text-[#1B1C1E]">Limitation Act</span>
                  <span className="text-[10px] text-[#524E48]">Act 36 of 1963</span>
                </div>
                <div className="border border-[#9E1B1B] bg-[#FAF6F0] p-2">
                  <span className="font-bold block text-[#9E1B1B]">NI Act S.138</span>
                  <span className="text-[10px] text-[#524E48]">30 Days Notice</span>
                </div>
              </div>

              <p className="font-body-serif text-xs text-[#35332F] mt-3 leading-relaxed">
                Computes hard legal deadlines for consumer complaints (2 years),
                cheque bounce notices (30 days + 1 month), summary suits (3 years),
                and criminal complaints under CrPC Section 468.
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-[#D8CEBF] flex items-center justify-between text-[10px] font-tech-mono text-[#7A7267]">
              <span>FastMCP: check_limitation_period</span>
              <span className="font-bold text-[#1B1C1E]">[02]</span>
            </div>
          </div>

          {/* CARD 3: Grounded RAG & Anti-Hallucination */}
          <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-5 shadow-[2px_2px_0_rgba(27,28,30,0.14)] hover:border-[#9E1B1B] transition-colors flex flex-col justify-between group">
            <span className="absolute top-1 left-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌜
            </span>
            <span className="absolute top-1 right-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌝
            </span>
            <span className="absolute bottom-1 left-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌞
            </span>
            <span className="absolute bottom-1 right-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌟
            </span>

            <div>
              <h3 className="font-editorial-serif font-bold text-xl text-[#1B1C1E]">
                Grounded RAG &amp; Anti-Hallucination
              </h3>
              <p className="font-tech-mono text-[11px] text-[#7A7267] mt-0.5">
                Visualizing citation attribution to [source.md]
              </p>

              {/* Graphic: Document stack with source tags */}
              <div className="mt-4 p-3 bg-[#EFE6D8] border border-[#C9BFB0] rounded-xs flex items-center justify-center gap-4">
                <div className="relative flex items-center">
                  <div className="w-9 h-11 bg-[#D8CEBF] border border-[#1B1C1E] rounded-xs -rotate-6 shadow-xs" />
                  <div className="w-9 h-11 bg-[#FAF6F0] border border-[#1B1C1E] rounded-xs -ml-6 rotate-2 shadow-xs flex flex-col justify-around p-1">
                    <span className="w-5 h-[1.5px] bg-[#9E1B1B]" />
                    <span className="w-4 h-[1.5px] bg-[#35332F]" />
                    <span className="w-6 h-[1.5px] bg-[#35332F]" />
                  </div>
                </div>

                <div className="space-y-1 font-tech-mono text-[10px]">
                  <div className="text-[#9E1B1B] font-semibold">
                    ### [source.md] Act Title - Section
                  </div>
                  <div className="text-[#524E48]">
                    Strict provenance tag on every chunk
                  </div>
                </div>
              </div>

              <p className="font-body-serif text-xs text-[#35332F] mt-3 leading-relaxed">
                Eliminates US/UK jurisdiction bleed (such as citing Miranda rights
                or the 5th Amendment). Enforces statutory attribution headers with
                Pydantic data models across 9 core Indian legal acts.
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-[#D8CEBF] flex items-center justify-between text-[10px] font-tech-mono text-[#7A7267]">
              <span>RAG: Pydantic RetrievedChunk</span>
              <span className="font-bold text-[#1B1C1E]">[RC]</span>
            </div>
          </div>

          {/* CARD 4: Multi-Turn SQLite Memory */}
          <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-5 shadow-[2px_2px_0_rgba(27,28,30,0.14)] hover:border-[#9E1B1B] transition-colors flex flex-col justify-between group">
            <span className="absolute top-1 left-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌜
            </span>
            <span className="absolute top-1 right-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌝
            </span>
            <span className="absolute bottom-1 left-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌞
            </span>
            <span className="absolute bottom-1 right-1 font-tech-mono text-[9px] text-[#7A7267] leading-none select-none">
              ⌟
            </span>

            <div>
              <h3 className="font-editorial-serif font-bold text-xl text-[#1B1C1E]">
                Multi-Turn SQLite Memory
              </h3>
              <p className="font-tech-mono text-[11px] text-[#7A7267] mt-0.5">
                Session-isolated sliding window compression database
              </p>

              {/* Graphic: Database rows table */}
              <div className="mt-4 p-2 bg-[#EFE6D8] border border-[#C9BFB0] rounded-xs font-tech-mono text-[10px] space-y-1">
                <div className="flex justify-between bg-[#FAF6F0] px-2 py-0.5 border border-[#D8CEBF]">
                  <span>Turn 1: User Legal Question</span>
                  <span className="text-[#9E1B1B]">Captured</span>
                </div>
                <div className="flex justify-between bg-[#FAF6F0] px-2 py-0.5 border border-[#D8CEBF]">
                  <span>Turn 2: Assistant Legal Synthesis</span>
                  <span className="text-[#1B8E2D]">Truncated</span>
                </div>
                <div className="flex justify-between bg-[#FAF6F0] px-2 py-0.5 border border-[#D8CEBF]">
                  <span>Sliding Window Prompt Window</span>
                  <span className="font-semibold text-[#1B1C1E]">Limit 6</span>
                </div>
              </div>

              <p className="font-body-serif text-xs text-[#35332F] mt-3 leading-relaxed">
                Persistent session memory stored in local SQLite (`conversations.db`).
                Provides conversational follow-up awareness (&quot;What is the punishment
                for this?&quot;) with sliding-window token condensation.
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-[#D8CEBF] flex items-center justify-between text-[10px] font-tech-mono text-[#7A7267]">
              <span>Core: ConversationMemory</span>
              <span className="font-bold text-[#1B1C1E]">[RH]</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
