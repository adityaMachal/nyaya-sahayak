"use client";

import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative w-full border-b border-[#C9BFB0] px-4 md:px-12 py-8 md:py-12 overflow-hidden">
      {/* Background Architectural Registration Tick Lines */}
      <div className="absolute top-0 left-8 w-[1px] h-12 bg-[#C9BFB0] pointer-events-none hidden md:block" />
      <div className="absolute top-6 left-2 w-16 h-[1px] bg-[#C9BFB0] pointer-events-none hidden md:block" />

      {/* Main Two-Column Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* LEFT COLUMN: Narrative & Typography (5 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col items-start z-10">
          {/* Project Log Status Bar */}
          <div className="w-full border-y border-[#D8CEBF] py-1.5 flex items-center justify-between gap-2 mb-4">
            <span className="font-tech-mono text-[10.5px] font-semibold tracking-wider text-[#9E1B1B] uppercase">
              PROJECT LOG // MULTI-AGENT INDIAN LEGAL AI ASSISTANT
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-tech-mono text-[9px] px-1 py-0.2 border border-[#7A7267] rounded-xs text-[#4A453E]">
                &gt;_
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#A61C1C]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#692624]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#242527]" />
            </div>
          </div>

          {/* Bilingual Hero Headlines with layered red barcode stripes */}
          <div className="relative">
            {/* Background Red Architectural Barcode Stripes behind text */}
            <div className="absolute -left-3 top-10 flex gap-2 opacity-15 pointer-events-none select-none -z-10">
              <span className="w-3.5 h-20 bg-[#C81919]" />
              <span className="w-2 h-20 bg-[#C81919]" />
              <span className="w-4 h-20 bg-[#C81919]" />
              <span className="w-1.5 h-20 bg-[#C81919]" />
              <span className="w-5 h-20 bg-[#C81919]" />
            </div>

            <h1 className="flex flex-col m-0">
              <span className="font-editorial-serif font-extrabold text-5xl md:text-[58px] leading-[1.04] text-[#1B1C1E] tracking-tight">
                Nyaya Sahayak
              </span>
              <span className="font-devanagari font-bold text-4xl md:text-[54px] leading-[1.12] text-[#1B1C1E] mt-1">
                न्याय सहायक
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="font-tech-mono text-base md:text-[17px] font-semibold text-[#1E2022] mt-3 tracking-tight">
            Engineering Dev Journal &amp; Architecture Log
          </p>

          {/* Body Narrative */}
          <p className="font-body-serif text-base md:text-[16px] leading-relaxed text-[#35332F] mt-3 max-w-lg">
            A technical chronicle of building a multi-agent AI system for Indian
            law. Documenting our architectural decisions, benchmark breakthroughs,
            and milestones from first commit to production.
          </p>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-3 w-full">
            <Link
              href="/chat"
              style={{
                clipPath:
                  "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
              }}
              className="relative bg-[#1F2123] hover:bg-[#2C2F33] text-[#F3EBDE] font-tech-mono text-xs font-semibold tracking-wider h-11 px-6 inline-flex items-center justify-center gap-2.5 transition-colors shadow-sm group"
            >
              {/* Crimson Accent Corner */}
              <span
                className="absolute top-0 left-0 w-3 h-3 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, #C81919 50%, transparent 50%)",
                }}
              />
              <span>READ DEV JOURNAL</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="group-hover:translate-x-0.5 transition-transform"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>

            <a
              href="#architecture"
              className="bg-[#FAF6F0] hover:bg-[#EFE6D8] text-[#1D1E20] border border-[#3C3833] font-tech-mono text-xs font-semibold tracking-wider h-11 px-5 inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>EXPLORE ARCHITECTURE</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path
                  d="M2 3.5h6.5v8M6 9l2.5 2.5L11 9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          {/* Build Metadata Strip */}
          <div className="mt-7 border-b border-[#D8CEBF] pb-1 inline-block">
            <span className="font-tech-mono text-[10.5px] font-semibold tracking-wider text-[#524E48] uppercase">
              BUILD v0.1.0-alpha • OCT 2026 • OPEN SOURCE
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: FIG 01. THE LEGAL ARCHITECT PLATE (6 cols on lg) */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end z-10">
          <div className="relative w-full max-w-[510px] group">
            {/* The Framed Artwork Card */}
            <div className="relative border-2 border-[#1B1C1E] bg-[#FAF6F0] p-1.5 shadow-[4px_4px_0_rgba(27,28,30,0.18)] transition-all">
              <Image
                src="/hero-artwork.png"
                alt="FIG 01. The Legal Architect - Multi-Agent Indian Law System"
                width={1200}
                height={1130}
                priority
                className="w-full h-auto block select-none"
              />

              {/* Hover Inspection Callout */}
              <div className="absolute bottom-4 left-4 bg-[#1B1C1E]/90 text-[#F3EBDE] font-tech-mono text-[10px] tracking-wider px-3 py-1.5 border border-[#9E1B1B] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                [ FIG 01: MULTI-AGENT INTAKE SYSTEM ]
              </div>
            </div>

            {/* Corner Register Crosshair Marks */}
            <div
              className="crosshair-mark"
              style={{ top: "-5px", left: "-5px" }}
            />
            <div
              className="crosshair-mark"
              style={{ top: "-5px", right: "-5px" }}
            />
            <div
              className="crosshair-mark"
              style={{ bottom: "-5px", left: "-5px" }}
            />
            <div
              className="crosshair-mark"
              style={{ bottom: "-5px", right: "-5px" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
