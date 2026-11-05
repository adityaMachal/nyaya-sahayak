"use client";

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-[#C9BFB0] px-4 md:px-12 py-10 bg-[#F3EBDE]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 bg-[#9E1B1B] rotate-45 inline-block" />
          <h2 className="font-editorial-serif font-bold text-2xl md:text-3xl text-[#1B1C1E] tracking-tight">
            STATUTORY COMPLIANCE COLOPHON &amp; FOOTER
          </h2>
        </div>

        {/* 1. Red Dashed Compliance Notice Box */}
        <div className="border-2 border-dashed border-[#9E1B1B] bg-[#FAF6F0] p-4 rounded-xs mb-8 shadow-xs">
          <div className="flex items-center gap-2 text-[#9E1B1B] font-tech-mono font-bold text-xs tracking-wider mb-1.5 uppercase">
            <span>⚖️ [NOTICE: ADVOCATES ACT, 1961 — LEGAL AWARENESS ENGINE ONLY]</span>
          </div>
          <p className="font-body-serif text-xs md:text-sm text-[#35332F] leading-relaxed">
            Nyaya Sahayak (न्याय सहायक) is an artificial intelligence legal research and
            procedural awareness system. It provides computational legal analysis, statutory
            cross-referencing, and educational guidance. It does <strong>not</strong> provide
            formal legal representation, attorney-client privileged counsel, or advocacy under
            Section 29 of the Advocates Act, 1961. For actual litigation, court filing, or formal
            pleading, always consult an advocate registered with a State Bar Council.
          </p>
        </div>

        {/* 2. Tech Stack 2x3 Grid + Author Stamp Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
          {/* Tech Stack Table (8 cols on lg) */}
          <div className="lg:col-span-8">
            <span className="font-tech-mono text-[10.5px] font-bold text-[#524E48] uppercase tracking-wider block mb-2">
              System Dependencies &amp; Core Technology Stack
            </span>
            <div className="border border-[#1B1C1E] bg-[#FAF6F0] rounded-xs overflow-hidden shadow-xs">
              <div className="grid grid-cols-3 divide-x divide-y divide-[#C9BFB0] font-tech-mono text-xs text-center">
                <div className="p-3 font-semibold text-[#1B1C1E] bg-[#EFE6D8]">LangGraph</div>
                <div className="p-3 font-semibold text-[#1B1C1E] bg-[#EFE6D8]">FastMCP</div>
                <div className="p-3 font-semibold text-[#1B1C1E] bg-[#EFE6D8]">Google Gemini</div>
                <div className="p-3 text-[#35332F]">ChromaDB</div>
                <div className="p-3 text-[#35332F]">FastAPI</div>
                <div className="p-3 text-[#35332F]">Next.js 15</div>
              </div>
            </div>
          </div>

          {/* Author Rubber Stamp & Colophon (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
            {/* Tilted Stamp Badge */}
            <div className="rubber-stamp border-[#9E1B1B] text-[#9E1B1B] text-xs px-4 py-1.5 rotate-[3deg] shadow-sm select-none">
              [ARCHITECTED BY ADITYA MACHAL]
            </div>

            <div className="font-tech-mono text-[10px] text-[#524E48] text-center lg:text-right mt-3 space-y-0.5">
              <div>NYAYA SAHAYAK • OPEN SOURCE LEGAL AI</div>
              <div>BNS 2023 &bull; BNSS 2023 &bull; BSA 2023 READY</div>
              <div className="text-[#7A7267]">Licensed under MIT • Python 3.14 &bull; Next.js 15</div>
            </div>
          </div>
        </div>

        {/* Bottom Decorative Center Crosshair */}
        <div className="mt-8 pt-4 border-t border-[#D8CEBF] flex justify-center text-[#7A7267]">
          <span className="font-tech-mono text-[11px] select-none">+</span>
        </div>
      </div>
    </footer>
  );
}
