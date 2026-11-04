"use client";

export default function BenchmarkTelemetry() {
  return (
    <section className="relative w-full border-b border-[#C9BFB0] px-4 md:px-12 py-10 bg-[#F3EBDE]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header Row with Stamp */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#9E1B1B] rotate-45 inline-block" />
            <h2 className="font-editorial-serif font-bold text-2xl md:text-3xl text-[#1B1C1E] tracking-tight">
              FIG 02. BENCHMARK TELEMETRY
            </h2>
          </div>

          {/* Tilted Red Rubber Stamp Badge */}
          <div className="rubber-stamp border-[#9E1B1B] text-[#9E1B1B] text-[11px] md:text-xs px-3 py-1 rotate-[-2deg] shadow-xs select-none">
            [BENCHMARK VERIFIED // RTX 3050 CUDA]
          </div>
        </div>

        {/* 4 Architectural Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* CARD 1: 1,128.2x SPEEDUP with Oscilloscope Latency Sparkline */}
          <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-4 flex flex-col justify-between shadow-[2px_2px_0_rgba(27,28,30,0.14)] hover:border-[#9E1B1B] transition-colors group">
            {/* Corner Bracket Accents */}
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
              <div className="flex items-baseline gap-1">
                <span className="font-editorial-serif font-extrabold text-3xl md:text-[34px] text-[#1B1C1E] tracking-tight">
                  1,128.2×
                </span>
              </div>
              <span className="font-tech-mono font-bold text-xs tracking-wider text-[#9E1B1B] block mt-0.5">
                SPEEDUP
              </span>
              <p className="font-body-serif text-xs leading-snug text-[#4A453E] mt-1.5 font-medium">
                7.21s → 0.005s
                <span className="block text-[11px] text-[#7A7267]">
                  Warm CUDA Singleton
                </span>
              </p>
            </div>

            {/* Miniature Oscilloscope Latency Sparkline */}
            <div className="mt-4 pt-2 border-t border-[#D8CEBF]">
              <div className="relative w-full h-14 bg-[#EFE6D8] border border-[#C9BFB0] rounded-xs p-1 overflow-hidden flex flex-col justify-between">
                {/* Latency Grid lines */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-25 pointer-events-none">
                  <div className="border-r border-b border-[#35332F]" />
                  <div className="border-r border-b border-[#35332F]" />
                  <div className="border-r border-b border-[#35332F]" />
                  <div className="border-r border-b border-[#35332F]" />
                  <div className="border-r border-b border-[#35332F]" />
                  <div className="border-b border-[#35332F]" />
                </div>

                {/* SVG Latency Curve: Cold start (7.2s) falling sharply to warm (5ms) */}
                <svg
                  className="w-full h-full relative z-10"
                  viewBox="0 0 160 46"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 5 6 L 25 7 L 35 38 L 50 39 L 75 39 L 100 39 L 125 39 L 155 39"
                    stroke="#1B1C1E"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Cold Call Dot */}
                  <circle cx="5" cy="6" r="2.5" fill="#9E1B1B" />
                  {/* Warm Stable Dot */}
                  <circle cx="155" cy="39" r="2.5" fill="#1B8E2D" />
                </svg>

                <div className="flex items-center justify-between text-[8.5px] font-tech-mono text-[#524E48] px-0.5">
                  <span>Cold: 7.21s</span>
                  <span className="text-[#1B8E2D] font-semibold">Warm: 5ms</span>
                </div>
              </div>
              <span className="font-tech-mono text-[9px] text-[#7A7267] block text-center mt-1">
                Oscilloscope Latency
              </span>
            </div>
          </div>

          {/* CARD 2: < 1ms EXECUTION */}
          <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-4 flex flex-col justify-between shadow-[2px_2px_0_rgba(27,28,30,0.14)] hover:border-[#9E1B1B] transition-colors group">
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
              <span className="font-editorial-serif font-extrabold text-3xl md:text-[34px] text-[#1B1C1E] tracking-tight">
                &lt; 1ms
              </span>
              <span className="font-tech-mono font-bold text-xs tracking-wider text-[#9E1B1B] block mt-0.5">
                EXECUTION
              </span>
              <p className="font-body-serif text-xs leading-snug text-[#4A453E] mt-1.5 font-medium">
                FastMCP In-Memory Tools
                <span className="block text-[11px] text-[#7A7267]">
                  (Subprocess Eliminated)
                </span>
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#D8CEBF] font-tech-mono text-[10px] text-[#4A453E]">
              <div className="bg-[#EFE6D8] p-2 border border-[#C9BFB0] rounded-xs space-y-1">
                <div className="flex justify-between">
                  <span>RPC Subprocess:</span>
                  <span className="line-through text-[#9E1B1B]">2.5s</span>
                </div>
                <div className="flex justify-between font-semibold text-[#1B8E2D]">
                  <span>In-Memory Registry:</span>
                  <span>&lt;0.001s</span>
                </div>
              </div>
              <span className="block text-center text-[9px] text-[#7A7267] mt-1">
                Zero IPC Startup Drag
              </span>
            </div>
          </div>

          {/* CARD 3: 358+ SECTIONS */}
          <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-4 flex flex-col justify-between shadow-[2px_2px_0_rgba(27,28,30,0.14)] hover:border-[#9E1B1B] transition-colors group">
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
              <span className="font-editorial-serif font-extrabold text-3xl md:text-[34px] text-[#1B1C1E] tracking-tight">
                358+
              </span>
              <span className="font-tech-mono font-bold text-xs tracking-wider text-[#9E1B1B] block mt-0.5">
                SECTIONS
              </span>
              <p className="font-body-serif text-xs leading-snug text-[#4A453E] mt-1.5 font-medium">
                BNS 2023 ↔ IPC 1860
                <span className="block text-[11px] text-[#7A7267]">
                  Cross-Referenced Corpus
                </span>
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#D8CEBF] font-tech-mono text-[10px] text-[#4A453E]">
              <div className="bg-[#EFE6D8] p-2 border border-[#C9BFB0] rounded-xs space-y-1">
                <div className="flex justify-between">
                  <span>BNSS 2023:</span>
                  <span className="font-medium">531 Sections</span>
                </div>
                <div className="flex justify-between">
                  <span>BSA 2023:</span>
                  <span className="font-medium">170 Sections</span>
                </div>
              </div>
              <span className="block text-center text-[9px] text-[#7A7267] mt-1">
                Colonial to Modern Mapping
              </span>
            </div>
          </div>

          {/* CARD 4: 100% ATTRIBUTED */}
          <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-4 flex flex-col justify-between shadow-[2px_2px_0_rgba(27,28,30,0.14)] hover:border-[#9E1B1B] transition-colors group">
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
              <span className="font-editorial-serif font-extrabold text-3xl md:text-[34px] text-[#1B1C1E] tracking-tight">
                100%
              </span>
              <span className="font-tech-mono font-bold text-xs tracking-wider text-[#9E1B1B] block mt-0.5">
                ATTRIBUTED
              </span>
              <p className="font-body-serif text-xs leading-snug text-[#4A453E] mt-1.5 font-medium">
                ChromaDB RAG
                <span className="block text-[11px] text-[#7A7267]">
                  Pydantic Chunk Provenance
                </span>
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#D8CEBF] font-tech-mono text-[10px] text-[#4A453E]">
              <div className="bg-[#EFE6D8] p-2 border border-[#C9BFB0] rounded-xs space-y-1">
                <div className="flex justify-between">
                  <span>Parsing Regressions:</span>
                  <span className="text-[#1B8E2D] font-semibold">0% (Typed)</span>
                </div>
                <div className="flex justify-between">
                  <span>Statutory Acts:</span>
                  <span className="font-medium">9 Core Domains</span>
                </div>
              </div>
              <span className="block text-center text-[9px] text-[#7A7267] mt-1">
                Pydantic RetrievedChunk Model
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
