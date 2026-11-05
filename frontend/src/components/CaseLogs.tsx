"use client";

import { useState } from "react";
import Link from "next/link";

interface CaseItem {
  id: string;
  tabLabel: string;
  queryTitle: string;
  queryBody: string;
  statutoryBasis: string;
  limitationText: string;
  checklist: string[];
}

const CASES: CaseItem[] = [
  {
    id: "bns302",
    tabLabel: "CASE #01: IPC 302 Homicide",
    queryTitle: "CITIZEN INQUIRY // POLICE FIR REGISTRATION",
    queryBody:
      "Is Section 302 of the Indian Penal Code still valid for filing an FIR for murder, or do we have to cite the new Bharatiya Nyaya Sanhita? What changed under the new criminal laws?",
    statutoryBasis:
      "Section 101 Bharatiya Nyaya Sanhita, 2023 (BNS) replaces Section 302 IPC. Procedural arrest and FIR governed under Section 173 Bharatiya Nagarik Suraksha Sanhita (BNSS 2023).",
    limitationText:
      "Statutory Limitation: No limitation period (Cognizable capital offense punishable with death / life imprisonment under CrPC S.468 / BNSS S.514).",
    checklist: [
      "Register FIR under Section 101 BNS 2023 at local police station",
      "Demand Zero-FIR if incident occurred outside police station territory",
      "Approach Magistrate under S.175(3) BNSS if police officer refuses registration",
    ],
  },
  {
    id: "s138",
    tabLabel: "CASE #02: S.138 Cheque Bounce",
    queryTitle: "CITIZEN INQUIRY // COMMERCIAL DEBT DEFAULT",
    queryBody:
      "A client issued a cheque for ₹3,50,000 which bounced yesterday marked 'funds insufficient'. What is the exact deadline to serve legal notice and initiate court proceedings?",
    statutoryBasis:
      "Section 138 & Section 142 Negotiable Instruments Act, 1881 (NI Act) read with Section 420 IPC / Section 318 BNS 2023.",
    limitationText:
      "Statutory Limitation: Strict 30-day statutory notice deadline from date of bank return memo. 15-day cure window. 1-month court filing deadline thereafter.",
    checklist: [
      "Dispatch statutory legal demand notice via registered post within 30 days",
      "Allow mandatory 15-day cure period for drawer to discharge liability",
      "Institute criminal complaint before JMFC/MM court within 1 month of cure expiry",
    ],
  },
  {
    id: "tenancy",
    tabLabel: "CASE #03: Tenancy Dispute",
    queryTitle: "CITIZEN INQUIRY // SECURITY DEPOSIT RECOVERY",
    queryBody:
      "My landlord is withholding my ₹1,20,000 security deposit after I vacated the apartment 45 days ago with no pending dues or damages. What are my legal remedies?",
    statutoryBasis:
      "Transfer of Property Act 1882 (Section 108), State Rent Control & Tenancy Acts, Consumer Protection Act 2019 (unfair trade practice).",
    limitationText:
      "Statutory Limitation: 3 years for civil recovery suit from lease termination; 2 years for consumer forum claim.",
    checklist: [
      "Send formal legal notice demanding refund with apartment handover receipt",
      "File claim before local Rent Authority under the Model Tenancy framework",
      "Institute Summary Suit under Order XXXVII CPC for recovery of liquidated debt",
    ],
  },
];

export default function CaseLogs() {
  const [activeTab, setActiveTab] = useState(0);
  const currentCase = CASES[activeTab];

  return (
    <section className="relative w-full border-b border-[#C9BFB0] px-4 md:px-12 py-10 bg-[#F3EBDE]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 bg-[#9E1B1B] rotate-45 inline-block" />
          <h2 className="font-editorial-serif font-bold text-2xl md:text-3xl text-[#1B1C1E] tracking-tight">
            FIG 05. CLINICAL CASE LOGS
          </h2>
        </div>

        {/* Dossier Tabs Header Bar */}
        <div className="flex flex-wrap gap-1 border-b border-[#1B1C1E] pb-0">
          {CASES.map((item, index) => {
            const isActive = activeTab === index;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`font-tech-mono text-[11px] md:text-xs font-semibold px-4 py-2 border-t-2 border-x transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#1F2123] text-[#F3EBDE] border-[#1F2123]"
                    : "bg-[#FAF6F0] text-[#1B1C1E] border-[#C9BFB0] hover:bg-[#EFE6D8]"
                }`}
              >
                {item.tabLabel}
              </button>
            );
          })}
        </div>

        {/* Master Case Study Frame */}
        <div className="border-2 border-t-0 border-[#1B1C1E] bg-[#FAF6F0] p-4 md:p-6 shadow-[3px_3px_0_rgba(27,28,30,0.18)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* LEFT CARD: Citizen Natural Language Inquiry */}
            <div className="border border-[#1B1C1E] bg-[#EFE6D8] p-4 flex flex-col justify-between shadow-xs">
              <div>
                <span className="font-tech-mono text-[10px] font-bold text-[#9E1B1B] tracking-wider uppercase block">
                  {currentCase.queryTitle}
                </span>
                <h3 className="font-editorial-serif font-bold text-lg text-[#1B1C1E] mt-1 mb-3">
                  Citizen Query
                </h3>
                <p className="font-body-serif text-sm leading-relaxed text-[#35332F] italic bg-[#FAF6F0] p-3 border border-[#C9BFB0] rounded-xs">
                  &ldquo;{currentCase.queryBody}&rdquo;
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-[#D8CEBF] flex items-center justify-between font-tech-mono text-[10px] text-[#7A7267]">
                <span>Status: Processed by Nyaya Sahayak</span>
                <span className="text-[#1B8E2D] font-semibold">100% Attributed</span>
              </div>
            </div>

            {/* RIGHT CARD: Structured Legal Memorandum */}
            <div className="border border-[#1B1C1E] bg-[#FAF6F0] p-4 flex flex-col justify-between shadow-xs">
              <div>
                <span className="font-tech-mono text-[10px] font-bold text-[#1B1C1E] tracking-wider uppercase block">
                  LEGAL MEMORANDUM // MULTI-AGENT SYNTHESIS
                </span>
                <h3 className="font-editorial-serif font-bold text-lg text-[#1B1C1E] mt-1 mb-2">
                  Statutory Analysis
                </h3>

                {/* Statutory Basis */}
                <div className="text-xs font-body-serif text-[#35332F] mb-3">
                  <strong className="font-tech-mono font-semibold text-[#1B1C1E] block text-[11px] mb-0.5">
                    Statutory Basis:
                  </strong>
                  <span>{currentCase.statutoryBasis}</span>
                </div>

                {/* Limitation Deadline Callout in Red */}
                <div className="border border-[#9E1B1B] bg-[#FDF2F2] p-2.5 rounded-xs mb-3">
                  <span className="font-tech-mono font-bold text-[11px] text-[#9E1B1B] block">
                    {currentCase.limitationText}
                  </span>
                </div>

                {/* 3-Step Procedural Checklist */}
                <div>
                  <span className="font-tech-mono font-bold text-[11px] text-[#1B1C1E] block mb-1">
                    3-Step Procedural Checklist:
                  </span>
                  <ul className="space-y-1 text-xs font-body-serif text-[#35332F]">
                    {currentCase.checklist.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#1B8E2D] font-bold">☑</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Direct Query Handoff CTA Button */}
              <div className="mt-5 pt-3 border-t border-[#D8CEBF] flex justify-end">
                <Link
                  href={`/chat?q=${encodeURIComponent(currentCase.queryBody)}`}
                  className="bg-[#1F2123] hover:bg-[#9E1B1B] text-[#F3EBDE] font-tech-mono text-xs font-semibold px-4 py-2 rounded-xs inline-flex items-center gap-2 transition-colors shadow-xs"
                >
                  <span>Try this case in live Chat</span>
                  <span>➔</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
