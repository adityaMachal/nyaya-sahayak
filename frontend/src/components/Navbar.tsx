"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [engineConnected, setEngineConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the local FastAPI backend is active
    fetch("http://localhost:8000/docs", { method: "HEAD", mode: "no-cors" })
      .then(() => setEngineConnected(true))
      .catch(() => setEngineConnected(false));
  }, []);

  return (
    <header className="relative w-full border-b border-[#C9BFB0] bg-[#F3EBDE] px-4 md:px-10 py-3 z-30 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Identity Left */}
      <Link href="/" className="flex flex-col group text-[#1B1C1E] no-underline">
        <div className="flex items-baseline gap-2">
          <span className="font-editorial-serif font-bold text-xl tracking-[0.02em] text-[#1B1C1E]">
            NYAYA SAHAYAK
          </span>
          <span className="text-[#9E9486] font-light">|</span>
          <span className="font-devanagari font-bold text-lg text-[#1B1C1E]">
            न्याय सहायक
          </span>
        </div>
        <span className="font-tech-mono text-[9px] font-semibold tracking-[0.06em] text-[#524E48] uppercase mt-0.5">
          ENGINEERING DEV JOURNAL &amp; ARCHITECTURE LOG
        </span>
      </Link>

      {/* Navigation Links & Repository CTA Right */}
      <div className="flex items-center gap-4 md:gap-6 flex-wrap">
        {/* Engine Connectivity Status Pill */}
        <div
          title={
            engineConnected
              ? "FastAPI Multi-Agent SSE Backend is Online"
              : "Backend server offline (Demo mode active)"
          }
          className="font-tech-mono text-[10px] tracking-wider px-2.5 py-1 border border-[#C9BFB0] rounded-sm flex items-center gap-1.5 bg-[#FAF6F0] text-[#35332F]"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              engineConnected ? "bg-[#1B8E2D] animate-pulse" : "bg-[#D88918]"
            }`}
          />
          <span>{engineConnected ? "ENGINE ONLINE" : "STANDALONE"}</span>
        </div>

        {/* Section Index Links */}
        <nav className="hidden lg:flex items-center gap-5 font-tech-mono text-xs font-medium text-[#1B1C1E]">
          <Link
            href="/chat"
            className="hover:text-[#9E1B1B] transition-colors py-1"
          >
            [01] JOURNAL
          </Link>
          <a
            href="#architecture"
            className="hover:text-[#9E1B1B] transition-colors py-1"
          >
            [02] ARCHITECTURE
          </a>
          <a
            href="#agents"
            className="hover:text-[#9E1B1B] transition-colors py-1"
          >
            [03] AGENT SYSTEM
          </a>
        </nav>

        {/* GitHub Repository Icon */}
        <a
          href="https://github.com/AdityaMachal/nyaya-sahayak"
          target="_blank"
          rel="noopener noreferrer"
          title="Nyaya Sahayak GitHub Repository"
          className="text-[#1B1C1E] hover:text-[#9E1B1B] transition-colors p-1"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        </a>

        {/* View Repository Button with Chamfer Cut */}
        <a
          href="https://github.com/AdityaMachal/nyaya-sahayak"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            clipPath:
              "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
          }}
          className="bg-[#1F2123] hover:bg-[#2C2F33] text-[#F3EBDE] font-tech-mono text-[11px] font-medium tracking-[0.04em] px-3.5 py-1.5 inline-flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span>[ VIEW REPOSITORY</span>
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path
              d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>]</span>
        </a>
      </div>

      {/* Decorative Center Crosshair (+) on Navbar bottom border */}
      <div
        className="crosshair-mark hidden md:block"
        style={{ left: "50%", bottom: "-6px" }}
      />
    </header>
  );
}
