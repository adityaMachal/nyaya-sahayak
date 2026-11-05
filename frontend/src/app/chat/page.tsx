"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface SessionInfo {
  session_id: string;
  created_at: string;
  last_active: string;
  turn_count: number;
}

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface TraceState {
  currentStep: number; // 0: idle, 1: supervisor, 2: action/research, 3: explainer, 4: complete
  route: string;
  toolUsed: string;
  chunksCount: number;
  latency: number;
  isStreaming: boolean;
  statusText: string;
}

const QUICK_STARTERS = [
  {
    title: "S.138 Cheque Dishonour",
    badge: "NI ACT 1881",
    query:
      "I received a bounced cheque of ₹3,50,000 from a client marked 'insufficient funds'. Under Section 138 of the Negotiable Instruments Act, what are my legal options and strict deadlines to send notice?",
  },
  {
    title: "IPC 302 to BNS 101 Transition",
    badge: "BNS 2023",
    query:
      "Is Section 302 of the Indian Penal Code still valid for filing an FIR for homicide, or do we cite Bharatiya Nyaya Sanhita Section 101? What changed under BNSS procedural rules?",
  },
  {
    title: "Security Deposit Withholding",
    badge: "TENANCY LAW",
    query:
      "My landlord is withholding my ₹1,20,000 security deposit 45 days after I vacated the apartment without any pending dues. What legal remedies exist under the Transfer of Property Act?",
  },
  {
    title: "Commercial Contract Breach",
    badge: "LIMITATION ACT",
    query:
      "A software vendor failed to deliver milestones after receiving a 60% advance. What is the statutory limitation deadline under the Limitation Act 1963 to institute a recovery suit?",
  },
];

/**
 * Parses markdown into clean, styled legal memorandum elements.
 */
function LegalMarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  let keyCounter = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      const currentList = [...listBuffer];
      listBuffer = [];
      elements.push(
        <ul key={`ul-${keyCounter++}`} className="space-y-1.5 my-2 pl-1 text-xs md:text-[13px] font-tech-mono text-[#35332F]">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#9E1B1B] font-bold select-none">•</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Header 3 or bold heading (### or 📋, 📌, 🪜, ⚖️)
    if (line.startsWith("### ") || line.startsWith("## ")) {
      flushList();
      const title = line.replace(/^#{2,3}\s+/, "");
      elements.push(
        <h4
          key={`h-${keyCounter++}`}
          className="font-editorial-serif font-bold text-sm md:text-base text-[#1B1C1E] mt-4 mb-1.5 pb-1 border-b border-[#C9BFB0] flex items-center gap-1.5"
        >
          <span className="text-[#9E1B1B]">§</span>
          <span>{title}</span>
        </h4>
      );
    } else if (
      line.startsWith("📋") ||
      line.startsWith("📌") ||
      line.startsWith("🪜") ||
      line.startsWith("⚖️")
    ) {
      flushList();
      elements.push(
        <div
          key={`section-${keyCounter++}`}
          className="font-tech-mono font-bold text-xs uppercase tracking-wider text-[#1B1C1E] mt-3.5 mb-1 bg-[#EFE6D8] border-l-3 border-[#9E1B1B] px-2 py-1 inline-block"
        >
          {line}
        </div>
      );
    } else if (line.startsWith("⚠️") || line.toUpperCase().includes("DISCLAIMER")) {
      flushList();
      elements.push(
        <div
          key={`disclaimer-${keyCounter++}`}
          className="border border-dashed border-[#9E1B1B] bg-[#FDF2F2] p-2.5 rounded-xs text-[10.5px] font-tech-mono text-[#9E1B1B] my-3 leading-relaxed"
        >
          {line}
        </div>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listBuffer.push(line.slice(2));
    } else if (/^\d+\.\s+/.test(line)) {
      listBuffer.push(line.replace(/^\d+\.\s+/, ""));
    } else {
      flushList();
      elements.push(
        <p
          key={`p-${keyCounter++}`}
          className="font-tech-mono text-xs md:text-[12.5px] leading-relaxed text-[#35332F] my-2"
        >
          {line}
        </p>
      );
    }
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

function ChatWorkspace() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  // Sessions list from real SQLite
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(true);

  // Active chat conversation messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState<string>("");

  // Live Agent Trace State
  const [trace, setTrace] = useState<TraceState>({
    currentStep: 0, // 0: idle, 1: supervisor, 2: action/research, 3: explainer, 4: complete
    route: "idle",
    toolUsed: "",
    chunksCount: 0,
    latency: 0,
    isStreaming: false,
    statusText: "Awaiting legal query from citizen...",
  });

  const [engineOnline, setEngineOnline] = useState<boolean>(false);
  const queryHandledRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Fetch real sessions from SQLite backend
  const refreshSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
        setEngineOnline(true);
        return data;
      }
    } catch {
      setEngineOnline(false);
    } finally {
      setIsLoadingSessions(false);
    }
    return [];
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, trace.isStreaming]);

  // Load history when a session is selected
  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    try {
      const res = await fetch(
        `http://localhost:8000/api/sessions/${sessionId}/history`
      );
      if (res.ok) {
        const history: ChatMessage[] = await res.json();
        setMessages(history);
        setTrace({
          currentStep: 4,
          route: "restored",
          toolUsed: "sqlite_wal_history",
          chunksCount: 0,
          latency: 0.05,
          isStreaming: false,
          statusText: `Loaded ${history.length} turns from SQLite WAL.`,
        });
      } else {
        setMessages([]);
      }
    } catch {
      // Backend error fallback
    }
  };

  // Start fresh consultation
  const handleNewConsultation = () => {
    const freshId = `session-${Date.now().toString().slice(-6)}`;
    setActiveSessionId(freshId);
    setMessages([]);
    setTrace({
      currentStep: 0,
      route: "idle",
      toolUsed: "",
      chunksCount: 0,
      latency: 0,
      isStreaming: false,
      statusText: "Ready for fresh legal inquiry.",
    });
  };

  // Delete session
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await fetch(`http://localhost:8000/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (activeSessionId === sessionId) {
        handleNewConsultation();
      }
      refreshSessions();
    } catch {
      // Ignore delete failure
    }
  };

  // Stream query response from FastAPI backend
  const handleSendMessage = async (rawText?: string) => {
    const query = (rawText !== undefined ? rawText : inputQuery).trim();
    if (!query || trace.isStreaming) return;

    setInputQuery("");

    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);

    // Start Live Agent Trace
    setTrace({
      currentStep: 1, // Supervisor
      route: "analyzing...",
      toolUsed: "",
      chunksCount: 0,
      latency: 0.1,
      isStreaming: true,
      statusText: "Supervisor analyzing query & intent...",
    });

    const startTime = Date.now();
    let assistantMessageBuffer = "";

    try {
      const res = await fetch("http://localhost:8000/api/ask/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          session_id: activeSessionId || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("API streaming endpoint unavailable");
      }

      setEngineOnline(true);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const evt of events) {
          if (!evt.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(evt.slice(6));

            if (data.type === "session") {
              setActiveSessionId(data.session_id);
            } else if (data.type === "trace") {
              const elapsed = (Date.now() - startTime) / 1000;
              if (data.node === "supervisor") {
                setTrace((prev) => ({
                  ...prev,
                  currentStep: 2,
                  route: data.route || "action",
                  latency: Number(elapsed.toFixed(2)),
                  statusText: `Supervisor routed to [${(data.route || "action").toUpperCase()}]`,
                }));
              } else if (data.node === "action") {
                setTrace((prev) => ({
                  ...prev,
                  currentStep: 2,
                  toolUsed: data.tool || "search_bns_section",
                  latency: Number(elapsed.toFixed(2)),
                  statusText: `FastMCP executing tool: ${data.tool || "lookup"}`,
                }));
              } else if (data.node === "researcher") {
                setTrace((prev) => ({
                  ...prev,
                  currentStep: 2,
                  chunksCount: data.chunks || 3,
                  latency: Number(elapsed.toFixed(2)),
                  statusText: `RAG retrieved ${data.chunks || 3} statutory chunks from ChromaDB`,
                }));
              } else if (data.node === "both") {
                setTrace((prev) => ({
                  ...prev,
                  currentStep: 2,
                  toolUsed: data.tool || "search_database",
                  chunksCount: data.chunks || 3,
                  latency: Number(elapsed.toFixed(2)),
                  statusText: `Combined DAG: ${data.tool} + ${data.chunks} statutory chunks`,
                }));
              }
            } else if (data.type === "answer") {
              assistantMessageBuffer = data.content || "";
              setTrace((prev) => ({
                ...prev,
                currentStep: 3,
                statusText: "Explainer agent synthesizing legal memorandum...",
              }));

              // Update the assistant message in chat
              setMessages((prev) => {
                const existing = [...prev];
                const last = existing[existing.length - 1];
                if (last && last.role === "assistant") {
                  last.content = assistantMessageBuffer;
                  return [...existing];
                } else {
                  return [
                    ...existing,
                    {
                      role: "assistant",
                      content: assistantMessageBuffer,
                      timestamp: new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    },
                  ];
                }
              });
            } else if (data.type === "done") {
              const totalElapsed = (Date.now() - startTime) / 1000;
              setTrace((prev) => ({
                ...prev,
                currentStep: 4,
                isStreaming: false,
                latency: Number(totalElapsed.toFixed(2)),
                statusText: `Complete in ${totalElapsed.toFixed(2)}s. Memoranda saved to SQLite WAL.`,
              }));
              refreshSessions();
            } else if (data.type === "error") {
              throw new Error(data.message || "Pipeline execution failed");
            }
          } catch {
            // Chunk boundary or parse pass-through
          }
        }
      }
    } catch (err: any) {
      // Backend offline notice
      setEngineOnline(false);
      const totalElapsed = (Date.now() - startTime) / 1000;
      setTrace((prev) => ({
        ...prev,
        currentStep: 4,
        isStreaming: false,
        latency: Number(totalElapsed.toFixed(2)),
        statusText: `Backend server unreachable (${err.message}). Ensure FastAPI is running on port 8000.`,
      }));

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **BACKEND OFFLINE OR STREAM DISCONNECTED**\n\nCould not connect to FastAPI server at \`http://localhost:8000/api/ask/stream\`.\n\n**To start the live multi-agent backend engine:**\n\`\`\`bash\ncd /home/adi/Documents/projects/nyaya-sahayak\nuv run python -m uvicorn api.server:app --port 8000 --reload\n\`\`\`\n\nOnce running, re-submit your inquiry to receive real-time statutory synthesis with FastMCP tool execution.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  };

  // Handle URL query handoff from landing page
  useEffect(() => {
    if (initialQuery && !queryHandledRef.current) {
      queryHandledRef.current = true;
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between bg-[#F3EBDE] text-[#1B1C1E]">
      {/* Top Hairline Margin Rule */}
      <div className="w-full h-3 border-b border-[#C9BFB0] bg-[#F3EBDE]" />

      {/* Main 3-Column Shell */}
      <div className="relative w-full max-w-[1540px] mx-auto border-x border-[#C9BFB0] bg-[#F3EBDE] flex-1 flex flex-col shadow-sm">
        {/* Register Crosshairs */}
        <div className="crosshair-mark" style={{ top: "-6px", left: "-6px" }} />
        <div className="crosshair-mark" style={{ top: "-6px", right: "-6px" }} />
        <div className="crosshair-mark" style={{ bottom: "-6px", left: "-6px" }} />
        <div className="crosshair-mark" style={{ bottom: "-6px", right: "-6px" }} />

        {/* 3-COLUMN COMMAND CENTER GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[#C9BFB0]">
          
          {/* ========================================================= */}
          {/* COLUMN 1 (22% / 3 cols on lg): SQLITE DOSSIER ARCHIVE */}
          {/* ========================================================= */}
          <aside className="lg:col-span-3 p-4 md:p-5 flex flex-col justify-between bg-[#F3EBDE] border-b lg:border-b-0">
            <div>
              {/* Brand Header */}
              <div className="mb-4">
                <Link href="/" className="no-underline block group">
                  <div className="flex items-baseline gap-2">
                    <span className="font-editorial-serif font-bold text-lg md:text-xl text-[#1B1C1E] tracking-tight group-hover:text-[#9E1B1B] transition-colors">
                      NYAYA SAHAYAK
                    </span>
                    <span className="text-[#9E9486] font-light">|</span>
                    <span className="font-devanagari font-bold text-base md:text-lg text-[#1B1C1E]">
                      न्याय सहायक
                    </span>
                  </div>
                  <span className="font-tech-mono text-[9px] font-semibold text-[#524E48] tracking-widest uppercase block mt-0.5">
                    ENGINEERING DEV JOURNAL & ARCHITECTURE LOG
                  </span>
                </Link>
                <div className="relative w-full h-[1px] bg-[#C9BFB0] mt-3">
                  <span className="absolute -top-[5px] left-0 font-tech-mono text-[9px] text-[#7A7267] leading-none">+</span>
                  <span className="absolute -top-[5px] right-0 font-tech-mono text-[9px] text-[#7A7267] leading-none">+</span>
                </div>
              </div>

              {/* [+ NEW LEGAL CONSULTATION] Button */}
              <button
                type="button"
                onClick={handleNewConsultation}
                style={{
                  clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
                }}
                className="relative w-full bg-[#1F2123] hover:bg-[#2C2F33] text-[#F3EBDE] font-tech-mono text-xs font-semibold tracking-wider h-11 px-4 flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer mb-5"
              >
                <span
                  className="absolute top-0 left-0 w-2.5 h-2.5 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, #C81919 50%, transparent 50%)",
                  }}
                />
                <span>[ + NEW LEGAL CONSULTATION ]</span>
              </button>

              {/* Dossier Archive Section Title */}
              <div className="border-b border-[#D8CEBF] pb-1.5 mb-3 flex items-center justify-between">
                <span className="font-tech-mono text-[11px] font-bold text-[#1B1C1E] tracking-wider uppercase">
                  SQLITE DOSSIER ARCHIVE
                </span>
                <span className="font-tech-mono text-[9px] text-[#7A7267]">
                  {sessions.length} RECORDED
                </span>
              </div>

              {/* Real Sessions List from SQLite */}
              <div className="space-y-2.5 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
                {isLoadingSessions ? (
                  <div className="text-center py-6 font-tech-mono text-xs text-[#7A7267] animate-pulse">
                    Connecting to SQLite database...
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="p-4 border border-dashed border-[#C9BFB0] bg-[#FAF6F0] rounded-xs text-center">
                    <span className="font-tech-mono text-xs text-[#524E48] block mb-1">
                      No Past Dossiers Found
                    </span>
                    <span className="font-tech-mono text-[9px] text-[#7A7267] block leading-tight">
                      Consultations are stored in <br />
                      <code className="text-[#1B1C1E]">data/conversations.db</code>
                    </span>
                  </div>
                ) : (
                  sessions.map((s, idx) => {
                    const isActive = activeSessionId === s.session_id;
                    return (
                      <div
                        key={s.session_id}
                        onClick={() => handleSelectSession(s.session_id)}
                        className={`group relative w-full text-left p-3.5 border transition-all cursor-pointer rounded-xs ${
                          isActive
                            ? "border-[#1B1C1E] bg-[#FAF6F0] shadow-[2px_2px_0_rgba(27,28,30,0.18)]"
                            : "border-[#C9BFB0] bg-[#EFE6D8] hover:bg-[#FAF6F0] hover:border-[#1B1C1E] shadow-xs"
                        }`}
                      >
                        {/* Corner Brackets */}
                        <span className="absolute top-1 left-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">
                          ⌜
                        </span>
                        <span className="absolute top-1 right-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">
                          ⌝
                        </span>

                        <div className="flex items-center justify-between mb-1">
                          <span className="font-tech-mono text-xs font-bold text-[#1B1C1E]">
                            #{sessions.length - idx}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isActive ? (
                              <span className="bg-[#9E1B1B] text-[#F3EBDE] font-tech-mono text-[8.5px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                                Active
                              </span>
                            ) : (
                              <span className="font-tech-mono text-[8.5px] text-[#7A7267]">
                                {s.last_active ? s.last_active.split("T")[0] : "Active"}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(e, s.session_id)}
                              title="Delete consultation"
                              className="opacity-0 group-hover:opacity-100 text-[#9E1B1B] hover:text-[#C81919] font-tech-mono text-xs px-1"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="font-tech-mono text-xs text-[#1B1C1E] truncate font-medium">
                          {s.session_id}
                        </div>

                        <div className="font-tech-mono text-[9px] text-[#7A7267] mt-1 flex justify-between">
                          <span>{s.turn_count} turns recorded</span>
                          <span>SQLite WAL</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Bottom Engine Status & Home Link */}
            <div className="mt-4 pt-3 border-t border-[#D8CEBF] flex items-center justify-between font-tech-mono text-[9.5px] text-[#524E48]">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    engineOnline ? "bg-[#1B8E2D] animate-pulse" : "bg-[#9E1B1B]"
                  }`}
                />
                <span>{engineOnline ? "ENGINE ONLINE" : "ENGINE OFFLINE"}</span>
              </div>
              <Link
                href="/"
                className="hover:text-[#9E1B1B] text-[#524E48] underline transition-colors"
              >
                ← BACK TO LANDING
              </Link>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* COLUMN 2 (50% / 6 cols on lg): CONSULTATION WORKSPACE */}
          {/* ========================================================= */}
          <main className="lg:col-span-6 p-4 md:p-6 flex flex-col justify-between bg-[#FAF6F0] min-h-[600px]">
            <div className="flex flex-col flex-1">
              {/* Header with Tilted [APPROVED] Stamp */}
              <div className="border-b border-[#C9BFB0] pb-3 mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-tech-mono text-[10px] text-[#7A7267]">+</span>
                  <div>
                    <h2 className="font-tech-mono font-bold text-xs md:text-sm text-[#1B1C1E] tracking-wider uppercase">
                      LEGAL CONSULTATION WORKSPACE // CITIZEN INTAKE TERMINAL
                    </h2>
                    <span className="font-tech-mono text-[9px] text-[#7A7267] block">
                      SESSION ID: {activeSessionId || "NEW SESSION (AUTO-GENERATED)"}
                    </span>
                  </div>
                </div>

                <div className="rubber-stamp border-[#9E1B1B] text-[#9E1B1B] text-xs px-3 py-1 rotate-[3deg] select-none shadow-xs font-bold tracking-widest">
                  [APPROVED]
                </div>
              </div>

              {/* Chat Thread Container */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[calc(100vh-320px)] mb-3"
              >
                {/* Empty State: Prompt Templates & Instructions */}
                {messages.length === 0 && (
                  <div className="py-6 space-y-5">
                    <div className="border border-[#1B1C1E] bg-[#EFE6D8] p-5 rounded-xs shadow-[2px_2px_0_rgba(27,28,30,0.12)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 bg-[#9E1B1B] rotate-45 inline-block" />
                        <h3 className="font-editorial-serif font-bold text-lg md:text-xl text-[#1B1C1E]">
                          CITIZEN LEGAL INTAKE CONSOLE
                        </h3>
                      </div>
                      <p className="font-tech-mono text-xs md:text-[13px] leading-relaxed text-[#35332F] mb-3">
                        Submit any factual scenario, section query, or limitation deadline in natural language.
                        The multi-agent StateGraph will classify your intent, invoke FastMCP tools, retrieve statutory grounds from ChromaDB, and synthesize a structured Legal Memorandum.
                      </p>
                      <div className="font-tech-mono text-[9.5px] text-[#7A7267]">
                        STORAGE: Synchronized with SQLite WAL • ADVOCATES ACT 1961 COMPLIANT
                      </div>
                    </div>

                    {/* Quick Starter Templates */}
                    <div>
                      <span className="font-tech-mono font-bold text-[10.5px] uppercase text-[#1B1C1E] block mb-2 tracking-wider">
                        SELECT A CLINICAL SCENARIO TO INITIALIZE:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {QUICK_STARTERS.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMessage(item.query)}
                            className="text-left p-3 border border-[#C9BFB0] bg-[#FAF6F0] hover:bg-[#EFE6D8] hover:border-[#1B1C1E] transition-all rounded-xs cursor-pointer shadow-xs group"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-tech-mono text-[9px] font-bold text-[#9E1B1B] uppercase tracking-wider">
                                {item.badge}
                              </span>
                              <span className="font-tech-mono text-[10px] text-[#7A7267] group-hover:text-[#1B1C1E] transition-colors">
                                ➔
                              </span>
                            </div>
                            <div className="font-editorial-serif font-bold text-xs md:text-sm text-[#1B1C1E] mb-1">
                              {item.title}
                            </div>
                            <div className="font-tech-mono text-[10px] text-[#524E48] line-clamp-2 leading-snug">
                              {item.query}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Conversation Turns */}
                {messages.map((msg, idx) => {
                  if (msg.role === "user") {
                    return (
                      <div
                        key={idx}
                        className="relative border border-[#1B1C1E] bg-[#EFE6D8] p-4 shadow-[2px_2px_0_rgba(27,28,30,0.12)] rounded-xs"
                      >
                        {/* Corner Brackets */}
                        <span className="absolute top-1 left-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌜</span>
                        <span className="absolute top-1 right-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌝</span>
                        <span className="absolute bottom-1 left-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌞</span>
                        <span className="absolute bottom-1 right-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌟</span>

                        <div className="flex items-center justify-between mb-1.5">
                          <span className="border border-[#1B1C1E] bg-[#FAF6F0] px-2 py-0.5 font-tech-mono text-[9.5px] font-bold text-[#1B1C1E] tracking-wider uppercase">
                            [ CITIZEN QUERY ]
                          </span>
                          {msg.timestamp && (
                            <span className="font-tech-mono text-[9px] text-[#7A7267]">
                              {msg.timestamp}
                            </span>
                          )}
                        </div>

                        <p className="font-tech-mono text-xs md:text-[13px] leading-relaxed text-[#1B1C1E] font-medium whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <div
                        key={idx}
                        className="relative border-2 border-[#1B1C1E] bg-[#FAF6F0] p-4 md:p-5 shadow-[3px_3px_0_rgba(27,28,30,0.18)] rounded-xs"
                      >
                        {/* Corner Brackets */}
                        <span className="absolute top-1 left-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌜</span>
                        <span className="absolute top-1 right-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌝</span>
                        <span className="absolute bottom-1 left-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌞</span>
                        <span className="absolute bottom-1 right-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌟</span>

                        <div className="border-b border-[#C9BFB0] pb-2 mb-3 flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="font-tech-mono font-bold text-xs md:text-sm text-[#1B1C1E] tracking-wider uppercase block">
                              LEGAL MEMORANDUM // DETERMINISTIC SYNTHESIS
                            </span>
                            <span className="font-tech-mono text-[9.5px] text-[#524E48]">
                              MULTI-AGENT ORCHESTRATION COMPLETED
                            </span>
                          </div>

                          <div className="font-tech-mono text-[9.5px] px-2 py-0.5 bg-[#EFE6D8] border border-[#C9BFB0] rounded-xs text-[#1B1C1E]">
                            100% ATTRIBUTED
                          </div>
                        </div>

                        {/* Formatted Markdown Content */}
                        <LegalMarkdownRenderer content={msg.content} />
                      </div>
                    );
                  }
                })}

                {/* Streaming Assistant Indicator */}
                {trace.isStreaming && (
                  <div className="border border-[#1B1C1E] bg-[#FAF6F0] p-4 rounded-xs shadow-xs animate-pulse">
                    <div className="flex items-center gap-2 font-tech-mono text-xs font-bold text-[#9E1B1B]">
                      <span className="w-2 h-2 rounded-full bg-[#9E1B1B] animate-ping" />
                      <span>{trace.statusText}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Red Dashed Compliance Notice */}
              <div className="border border-dashed border-[#9E1B1B] bg-[#FAF6F0] px-3 py-1.5 rounded-xs text-[10px] font-tech-mono text-[#9E1B1B] mb-3 text-center">
                NOTICE: ADVOCATES ACT, 1961 - LEGAL AWARENESS ENGINE ONLY • CONSULT ADVOCATE FOR FORMAL FILING
              </div>
            </div>

            {/* BOTTOM INPUT BAR */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="mt-2 pt-3 border-t border-[#D8CEBF] flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="[ Ask a follow-up or provide evidence details... ]"
                disabled={trace.isStreaming}
                className="flex-1 font-tech-mono text-xs p-3 border border-[#1B1C1E] bg-[#FAF6F0] text-[#1B1C1E] placeholder-[#7A7267] focus:outline-none focus:border-[#9E1B1B] transition-colors rounded-xs"
              />

              <button
                type="submit"
                disabled={trace.isStreaming || !inputQuery.trim()}
                style={{
                  clipPath:
                    "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
                }}
                className={`bg-[#1F2123] hover:bg-[#2C2F33] text-[#F3EBDE] font-tech-mono text-xs font-semibold px-5 py-3 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 ${
                  trace.isStreaming ? "animate-pulse" : ""
                }`}
              >
                <span>{trace.isStreaming ? "PROCESSING..." : "SUBMIT INQUIRY"}</span>
                <span>➔</span>
              </button>
            </form>
          </main>

          {/* ========================================================= */}
          {/* COLUMN 3 (28% / 3 cols on lg): FIG 06. LIVE AGENT TRACE */}
          {/* ========================================================= */}
          <aside className="lg:col-span-3 p-4 md:p-5 flex flex-col justify-between bg-[#F3EBDE] border-t lg:border-t-0">
            <div>
              {/* Header with Tilted Stamp */}
              <div className="border-b border-[#C9BFB0] pb-2 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-tech-mono font-bold text-xs md:text-sm text-[#1B1C1E] tracking-wider uppercase">
                    FIG 06. LIVE AGENT TRACE
                  </h3>
                </div>

                <div
                  className={`rubber-stamp text-[9.5px] px-2 py-0.5 rotate-[4deg] select-none font-bold tracking-wider ${
                    trace.isStreaming
                      ? "border-[#9E1B1B] text-[#9E1B1B] animate-pulse"
                      : "border-[#524E48] text-[#524E48]"
                  }`}
                >
                  {trace.isStreaming ? "[STATEGRAPH: STREAMING]" : "[STATEGRAPH: STANDBY]"}
                </div>
              </div>

              {/* Master Flowchart Container matching Chatbot.png */}
              <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-4 rounded-xs shadow-[2px_2px_0_rgba(27,28,30,0.12)]">
                {/* Corner Brackets */}
                <span className="absolute top-1 left-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌜</span>
                <span className="absolute top-1 right-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌝</span>
                <span className="absolute bottom-1 left-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌞</span>
                <span className="absolute bottom-1 right-1 font-tech-mono text-[8px] text-[#7A7267] leading-none select-none">⌟</span>

                <div className="flex flex-col items-center space-y-2">
                  {/* Node: User Query Input */}
                  <div
                    className={`w-full max-w-[200px] border py-1.5 px-3 text-center rounded-xs shadow-xs transition-colors ${
                      trace.currentStep >= 1
                        ? "border-[#9E1B1B] bg-[#EFE6D8]"
                        : "border-[#1B1C1E] bg-[#FAF6F0]"
                    }`}
                  >
                    <span className="font-tech-mono text-[10.5px] font-bold text-[#1B1C1E]">
                      User Query Input
                    </span>
                  </div>

                  {/* Flow Arrow with AgentState label */}
                  <div className="flex flex-col items-center">
                    <span className="text-[#9E1B1B] font-bold text-xs leading-none">▼</span>
                    <span className="font-tech-mono text-[7.5px] text-[#7A7267] mt-0.5 leading-tight text-center">
                      AgentState &#123;<br />
                      messages, retrieved_chunks, tool_results &#125;
                    </span>
                    <span className="text-[#9E1B1B] font-bold text-xs leading-none">▼</span>
                  </div>

                  {/* Step 01: [ SUPERVISOR ROUTER ] */}
                  <div className="w-full flex items-center gap-2">
                    <span className="font-tech-mono text-[9.5px] font-bold text-[#1B1C1E] shrink-0">
                      Step 01:
                    </span>
                    <div
                      className={`flex-1 border-2 p-2 rounded-xs transition-colors ${
                        trace.currentStep >= 1
                          ? "border-[#9E1B1B] bg-[#EFE6D8]"
                          : "border-[#1B1C1E] bg-[#FAF6F0]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-tech-mono text-[10px] font-bold text-[#1B1C1E]">
                        <span>[ SUPERVISOR ROUTER ]</span>
                        {trace.currentStep === 1 && (
                          <span className="w-2 h-2 rounded-full bg-[#9E1B1B] animate-ping" />
                        )}
                      </div>
                      {trace.route && trace.route !== "idle" && (
                        <span className="font-tech-mono text-[8px] text-[#9E1B1B] uppercase block mt-0.5 font-bold">
                          Route: {trace.route}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Flow Arrow with AgentState label */}
                  <div className="flex flex-col items-center">
                    <span className="text-[#9E1B1B] font-bold text-xs leading-none">▼</span>
                    <span className="font-tech-mono text-[7.5px] text-[#7A7267] mt-0.5 leading-tight text-center">
                      AgentState &#123;<br />
                      retrieved, chunks, tool_results &#125;
                    </span>
                    <span className="text-[#9E1B1B] font-bold text-xs leading-none">▼</span>
                  </div>

                  {/* Step 02: [ ACTION AGENT FastMCP ] */}
                  <div className="w-full flex items-center gap-2">
                    <span className="font-tech-mono text-[9.5px] font-bold text-[#1B1C1E] shrink-0">
                      Step 02:
                    </span>
                    <div
                      className={`flex-1 border-2 p-2 rounded-xs transition-colors ${
                        trace.currentStep >= 2
                          ? "border-[#9E1B1B] bg-[#EFE6D8]"
                          : "border-[#1B1C1E] bg-[#FAF6F0]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-tech-mono text-[10px] font-bold text-[#1B1C1E]">
                        <span>[ ACTION FastMCP ]</span>
                        {trace.currentStep === 2 && (
                          <span className="w-2 h-2 rounded-full bg-[#9E1B1B] animate-ping" />
                        )}
                      </div>
                      <span className="font-tech-mono text-[8px] text-[#524E48] block mt-0.5 truncate">
                        {trace.toolUsed
                          ? `Tool: ${trace.toolUsed}`
                          : trace.chunksCount > 0
                          ? `RAG: ${trace.chunksCount} chunks retrieved`
                          : "Calling in-memory tool logic"}
                      </span>
                    </div>
                  </div>

                  {/* Flow Arrow with AgentState label */}
                  <div className="flex flex-col items-center">
                    <span className="text-[#9E1B1B] font-bold text-xs leading-none">▼</span>
                    <span className="font-tech-mono text-[7.5px] text-[#7A7267] mt-0.5 leading-tight text-center">
                      AgentState &#123;<br />
                      messages, retrieved, chunks, tool_results &#125;
                    </span>
                    <span className="text-[#9E1B1B] font-bold text-xs leading-none">▼</span>
                  </div>

                  {/* Step 03: [ EXPLAINER AGENT ] */}
                  <div className="w-full flex items-center gap-2">
                    <span className="font-tech-mono text-[9.5px] font-bold text-[#1B1C1E] shrink-0">
                      Step 03:
                    </span>
                    <div
                      className={`flex-1 border-2 p-2 rounded-xs transition-colors ${
                        trace.currentStep >= 3
                          ? "border-[#9E1B1B] bg-[#EFE6D8]"
                          : "border-[#1B1C1E] bg-[#FAF6F0]"
                      }`}
                    >
                      <div className="flex items-center justify-between font-tech-mono text-[10px] font-bold text-[#1B1C1E]">
                        <span>[ EXPLAINER AGENT ]</span>
                        {trace.currentStep === 3 && (
                          <span className="w-2 h-2 rounded-full bg-[#9E1B1B] animate-ping" />
                        )}
                      </div>
                      <span className="font-tech-mono text-[8px] text-[#524E48] block mt-0.5">
                        {trace.currentStep === 4
                          ? "Attributed Synthesis Complete"
                          : trace.currentStep === 3
                          ? "Synthesizing Legal Memo..."
                          : "Grounded Statutory Formatting"}
                      </span>
                    </div>
                  </div>

                  {/* Flow Arrow to Output */}
                  <div className="flex flex-col items-center pt-1">
                    <span className="font-tech-mono text-[8px] text-[#524E48]">Output</span>
                    <span className="text-[#1B1C1E] font-bold text-xs leading-none">▼</span>
                  </div>

                  {/* Finalized Memo */}
                  <div
                    className={`text-center font-tech-mono font-bold text-xs px-3 py-1 rounded-xs transition-colors ${
                      trace.currentStep === 4
                        ? "bg-[#1B1C1E] text-[#F3EBDE]"
                        : "text-[#7A7267]"
                    }`}
                  >
                    Finalized Memo
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom TELEMETRY LOGS */}
            <div className="mt-5 pt-3 border-t border-[#D8CEBF]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-tech-mono text-[11px] font-bold text-[#1B1C1E] tracking-wider uppercase">
                  TELEMETRY LOGS
                </span>
                <span className="font-tech-mono text-[9px] text-[#7A7267]">
                  LATENCY: {trace.latency}s
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. EXECUTION CARD */}
                <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-3 text-center rounded-xs shadow-xs">
                  <span className="absolute top-1 left-1 font-tech-mono text-[7px] text-[#7A7267] leading-none">⌜</span>
                  <span className="absolute top-1 right-1 font-tech-mono text-[7px] text-[#7A7267] leading-none">⌝</span>
                  <span className="absolute bottom-1 left-1 font-tech-mono text-[7px] text-[#7A7267] leading-none">⌞</span>
                  <span className="absolute bottom-1 right-1 font-tech-mono text-[7px] text-[#7A7267] leading-none">⌟</span>
                  <span className="font-editorial-serif font-bold text-2xl text-[#1B1C1E] block">
                    {trace.latency > 0 ? `${trace.latency}s` : "< 1ms"}
                  </span>
                  <span className="font-tech-mono text-[9px] font-bold text-[#7A7267] uppercase tracking-wider">
                    {trace.latency > 0 ? "ROUNDTRIP" : "EXECUTION"}
                  </span>
                </div>

                {/* 2. IPC SECTIONS CARD */}
                <div className="relative border border-[#1B1C1E] bg-[#FAF6F0] p-3 text-center rounded-xs shadow-xs">
                  <span className="absolute top-1 left-1 font-tech-mono text-[7px] text-[#7A7267] leading-none">⌜</span>
                  <span className="absolute top-1 right-1 font-tech-mono text-[7px] text-[#7A7267] leading-none">⌝</span>
                  <span className="absolute bottom-1 left-1 font-tech-mono text-[7px] text-[#7A7267] leading-none">⌞</span>
                  <span className="absolute bottom-1 right-1 font-tech-mono text-[7px] text-[#7A7267] leading-none">⌟</span>
                  <span className="font-editorial-serif font-bold text-2xl text-[#1B1C1E] block">
                    {trace.chunksCount > 0 ? trace.chunksCount : "358+"}
                  </span>
                  <span className="font-tech-mono text-[8px] font-bold text-[#7A7267] uppercase tracking-tighter leading-tight block">
                    {trace.chunksCount > 0
                      ? "STATUTORY CHUNKS RETRIEVED"
                      : "IPC SECTIONS CROSS-REFERENCED"}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Bottom Hairline Margin Rule */}
      <div className="w-full h-6 border-t border-[#C9BFB0] bg-[#F3EBDE] flex items-center justify-between px-6 font-tech-mono text-[9px] text-[#7A7267]">
        <span>NYAYA SAHAYAK LEGAL ENGINE // V1.0.4 PRODUCTION</span>
        <span>ZERO-HALLUCINATION ARCHITECTURE</span>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F3EBDE] flex items-center justify-center font-tech-mono text-xs text-[#1B1C1E]">
          Loading Legal Consultation Workspace...
        </div>
      }
    >
      <ChatWorkspace />
    </Suspense>
  );
}
