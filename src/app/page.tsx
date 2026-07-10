"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Terminal, Send, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, RefreshCw, History, Download, Bot, User, Loader2, Cpu, BarChart3, Globe2, Calculator, Coins, Scale, Percent, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@ai-sdk/react";

interface Metric {
  name: string;
  value: string;
  status: "good" | "bad" | "neutral";
}

interface AnalysisResult {
  verdict: "INVEST" | "PASS";
  reasoning: string;
  metrics: Metric[];
  strengths: string[];
  weaknesses: string[];
  logs: string[];
  projections: number[];
}

interface HistoryItem {
  company: string;
  date: string;
  data: AnalysisResult;
}

export default function Home() {
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "logging" | "done" | "error">("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatInput, setChatInput] = useState("");

  // Investment Calculator States
  const [calcPrincipal, setCalcPrincipal] = useState<number>(10000);
  const [calcMonthly, setCalcMonthly] = useState<number>(1000);
  const [calcMode, setCalcMode] = useState<"lumpSum" | "sip">("sip");
  const [calcYears, setCalcYears] = useState<number>(10);
  const [calcGrowth, setCalcGrowth] = useState<number>(15);
  const [calcRiskProfile, setCalcRiskProfile] = useState<"bear" | "base" | "bull">("base");
  const [calcInflationAdjusted, setCalcInflationAdjusted] = useState<boolean>(false);
  const [calcInflationRate, setCalcInflationRate] = useState<number>(6);
  const [calcPortfolioRisk, setCalcPortfolioRisk] = useState<"conservative" | "moderate" | "aggressive">("moderate");

  // Dynamically set default growth rate when a new company result is loaded or set
  useEffect(() => {
    if (result) {
      if (result.projections && result.projections.length > 1) {
        const startVal = result.projections[0];
        const endVal = result.projections[result.projections.length - 1];
        const rate = Math.round((Math.pow(endVal / startVal, 1 / (result.projections.length - 1)) - 1) * 100);
        setCalcGrowth(rate > 0 ? rate : 15);
      } else {
        setCalcGrowth(result.verdict === "INVEST" ? 18 : 8);
      }
    }
  }, [result]);

  // Compute calculator projection arrays
  const computeCalculatorResults = () => {
    if (!result) return { historical: [], future: [], totalInvested: 0, finalValue: 0, wealthCreated: 0 };

    // Calculate Historical (Last 5 Years) working backward
    const historicalFactors = [0.55, 0.65, 0.75, 0.88, 1.0];
    const historical = historicalFactors.map((factor, idx) => {
      const year = -5 + idx;
      const value = calcMode === "lumpSum"
        ? calcPrincipal * factor
        : (calcPrincipal + calcMonthly * 12 * idx) * factor;
      return {
        year,
        value: Math.round(value),
        invested: calcMode === "lumpSum" ? calcPrincipal : calcPrincipal + calcMonthly * 12 * idx,
      };
    });

    // Calculate Future (Next 5 to 10 Years)
    let rate = calcGrowth / 100;
    if (calcRiskProfile === "bear") rate -= 0.06;
    if (calcRiskProfile === "bull") rate += 0.05;

    if (calcInflationAdjusted) {
      rate = (1 + rate) / (1 + calcInflationRate / 100) - 1;
    }

    const future = [];
    let currentVal = calcPrincipal;
    let totalInvested = calcPrincipal;

    for (let y = 1; y <= calcYears; y++) {
      if (calcMode === "lumpSum") {
        currentVal = calcPrincipal * Math.pow(1 + rate, y);
        totalInvested = calcPrincipal;
      } else {
        for (let m = 0; m < 12; m++) {
          currentVal = (currentVal + calcMonthly) * (1 + rate / 12);
        }
        totalInvested = calcPrincipal + calcMonthly * 12 * y;
      }
      future.push({
        year: y,
        value: Math.round(currentVal),
        invested: totalInvested,
      });
    }

    const finalValue = future.length > 0 ? future[future.length - 1].value : calcPrincipal;
    const finalInvested = future.length > 0 ? future[future.length - 1].invested : calcPrincipal;
    const wealthCreated = Math.max(0, finalValue - finalInvested);

    return { historical, future, totalInvested: finalInvested, finalValue, wealthCreated };
  };

  const calcResults = computeCalculatorResults();

  // Get recommended portfolio allocation based on verdict and user risk selection
  const getRecommendedAllocation = () => {
    if (!result) return 0;
    if (result.verdict === "PASS") {
      return calcPortfolioRisk === "aggressive" ? 2 : 0;
    }
    // INVEST verdict allocation
    switch (calcPortfolioRisk) {
      case "conservative": return 3;
      case "moderate": return 7;
      case "aggressive": return 15;
      default: return 5;
    }
  };

  // Initialize Vercel AI SDK chat hook with custom payload context
  const {
    messages: chatMessages,
    sendMessage,
    status: chatStatus,
    setMessages: setChatMessages
  } = useChat();

  const chatLoading = chatStatus === "streaming" || chatStatus === "submitted";

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("insideiim_analysis_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Trigger scroll on terminal logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Trigger scroll on follow-up chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Simulate scrolling terminal logs during the "logging" state
  useEffect(() => {
    if (status === "logging" && result) {
      if (currentLogIndex < result.logs.length) {
        const timer = setTimeout(() => {
          setTerminalLogs((prev) => [...prev, result.logs[currentLogIndex]]);
          setCurrentLogIndex((prev) => prev + 1);
        }, 800);
        return () => clearTimeout(timer);
      } else {
        setStatus("done");
        // Clear past follow-up chats on new report complete
        setChatMessages([]);
        // Save to history once analysis is complete
        const newItem: HistoryItem = {
          company: company.toUpperCase(),
          date: new Date().toLocaleString(),
          data: result,
        };
        const updatedHistory = [newItem, ...history.filter(item => item.company !== newItem.company)].slice(0, 10);
        setHistory(updatedHistory);
        localStorage.setItem("insideiim_analysis_history", JSON.stringify(updatedHistory));
      }
    }
  }, [status, currentLogIndex, result, company, history, setChatMessages]);

  const triggerAnalysis = async (companyName: string) => {
    if (!companyName) return;

    setStatus("loading");
    setResult(null);
    setTerminalLogs(["[AGENT] Initializing multi-agent investment research flow...", `[AGENT] Target company identified: ${companyName.toUpperCase()}`]);
    setCurrentLogIndex(0);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });

      if (!res.ok) throw new Error("Analysis failed");

      const data: AnalysisResult = await res.json();
      setResult(data);
      setStatus("logging");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTerminalLogs((prev) => [...prev, "[FATAL ERROR] Agent connection terminated unexpectedly."]);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerAnalysis(company);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setCompany(item.company);
    setResult(item.data);
    setTerminalLogs(item.data.logs);
    setChatMessages([]);
    setStatus("done");
  };

  const handleReset = () => {
    setCompany("");
    setStatus("idle");
    setResult(null);
    setTerminalLogs([]);
    setChatMessages([]);
    setCurrentLogIndex(0);
  };

  const exportToMarkdown = () => {
    if (!result) return;
    const mdContent = `# INVESTMENT ANALYSIS REPORT: ${company.toUpperCase()}
Date Generated: ${new Date().toLocaleString()}
Verdict: ${result.verdict}

## Executive Rationale
${result.reasoning}

## Key Metrics
${result.metrics.map(m => `- ${m.name}: ${m.value} (${m.status.toUpperCase()})`).join("\n")}

## Strengths & Moats
${result.strengths.map(s => `- ${s}`).join("\n")}

## Vulnerabilities & Risks
${result.weaknesses.map(w => `- ${w}`).join("\n")}

## Projections (5-Year Value Outlook)
${result.projections.map((p, idx) => `Year ${idx}: ${p}`).join("\n")}

## Agent Investigation Audit Logs
${result.logs.map(log => `- ${log}`).join("\n")}
`;

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `investment-analysis-${company.toLowerCase()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getSvgPath = (projections: number[]) => {
    const width = 500;
    const height = 180;
    const padding = 30;
    const minVal = Math.min(...projections) * 0.9;
    const maxVal = Math.max(...projections) * 1.1;
    const valRange = maxVal - minVal;

    const points = projections.map((val, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (projections.length - 1);
      const y = height - padding - ((val - minVal) * (height - padding * 2)) / valRange;
      return { x, y, val };
    });

    const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    return { pathData, points, width, height };
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="flex-grow flex relative">
        {/* History Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-[#333] bg-[#09090b] flex-shrink-0 overflow-y-auto hidden md:block"
            >
              <div className="p-6">
                <h3 className="font-heading text-lg font-bold mb-6 tracking-wide flex items-center gap-2 uppercase">
                  <History size={18} className="text-retro-accent" /> System History
                </h3>
                {history.length === 0 ? (
                  <p className="text-zinc-600 font-mono text-xs">No previous logs found.</p>
                ) : (
                  <div className="space-y-4">
                    {history.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left retro-border p-3 bg-[#0f0f11] hover:bg-[#16161a] transition-all flex flex-col gap-1 border-zinc-700"
                      >
                        <span className="font-heading text-sm font-bold tracking-tight">{item.company}</span>
                        <div className="flex justify-between items-center w-full mt-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${item.data.verdict === "INVEST" ? "bg-retro-green/20 text-retro-green" : "bg-retro-red/20 text-retro-red"
                            }`}>
                            {item.data.verdict}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">{item.date.split(",")[0]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center py-12 px-6 overflow-x-hidden">
          <div className="max-w-4xl w-full">
            {/* Header controls */}
            <div className="flex justify-between items-center mb-8">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="retro-border px-4 py-2 bg-[#0f0f11] hover:bg-zinc-800 font-mono text-xs flex items-center gap-2 uppercase"
              >
                <History size={14} className="text-retro-accent" />
                {sidebarOpen ? "Hide Logs" : "Show Logs"}
              </button>
              {status === "done" && (
                <div className="flex gap-3">
                  <button
                    onClick={exportToMarkdown}
                    className="retro-border px-4 py-2 bg-[#0f0f11] hover:bg-zinc-800 font-mono text-xs flex items-center gap-2 uppercase"
                  >
                    <Download size={14} className="text-retro-accent" /> Export Report
                  </button>
                </div>
              )}
            </div>

            {/* Title / Hero */}
            {status === "idle" && (
              <div className="text-center mb-12 animate-slide-up">
                <h1 className="font-heading text-5xl md:text-6xl font-extrabold tracking-tight mb-4 uppercase">
                  AI <span className="text-retro-accent">Investment</span> Research Agent
                </h1>
                <p className="text-gray-400 font-mono text-sm max-w-xl mx-auto">
                  Execute a multi-agent quantitative & qualitative analysis on any stock or enterprise. Decides whether to INVEST or PASS with complete reasoning logs.
                </p>
              </div>
            )}

            {/* Input Terminal & Trending Dashboard */}
            {status === "idle" && (
              <div className="space-y-8 animate-slide-up">
                <form onSubmit={handleAnalyze} className="retro-border p-6 bg-[#0f0f11]">
                  <div className="flex items-center gap-3 mb-4 text-zinc-500 font-mono text-xs">
                    <Terminal size={14} className="text-retro-accent" />
                    <span>TERMINAL_INPUT_AWAITING_INSTRUCTION</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Enter Company Name or Ticker (e.g. Nvidia, AAPL, Tesla)..."
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="flex-grow bg-[#050507] border-2 border-zinc-700 p-4 font-mono text-foreground focus:outline-none focus:border-retro-accent transition-colors uppercase"
                    />
                    <button
                      type="submit"
                      disabled={!company}
                      className="retro-border bg-retro-accent text-black font-heading font-bold px-8 py-4 uppercase tracking-wider hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      Analyze
                    </button>
                  </div>

                  {/* Quick Start Seeds */}
                  <div className="mt-6 border-t border-zinc-800 pt-4">
                    <div className="text-zinc-500 font-mono text-xs mb-3 uppercase tracking-wider">Suggested Research Targets:</div>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { name: "Tata Motors", ticker: "TATAMOTORS" },
                        { name: "Reliance Industries", ticker: "RELIANCE" },
                        { name: "Infosys", ticker: "INFY" },
                        { name: "Nvidia", ticker: "NVDA" },
                        { name: "Tesla", ticker: "TSLA" }
                      ].map((item) => (
                        <button
                          key={item.ticker}
                          type="button"
                          onClick={() => {
                            setCompany(item.name);
                            triggerAnalysis(item.name);
                          }}
                          className="px-3.5 py-1.5 border border-zinc-700 bg-[#050507] text-zinc-400 hover:text-retro-accent hover:border-retro-accent font-mono text-xs uppercase transition-all rounded cursor-pointer"
                        >
                          + {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>

                {/* System Diagnostics / Metrics Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="retro-border border-zinc-800 p-4 bg-[#050507] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase block">Agent Latency</span>
                      <span className="text-base font-bold font-mono text-[#fafafa]">42 ms // ULTRA_LOW</span>
                    </div>
                    <Cpu className="text-retro-secondary opacity-60" size={20} />
                  </div>

                  <div className="retro-border border-zinc-800 p-4 bg-[#050507] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase block">Model Core</span>
                      <span className="text-base font-bold font-mono text-[#fafafa]">Gemini 2.5 Flash</span>
                    </div>
                    <BarChart3 className="text-retro-accent opacity-60" size={20} />
                  </div>

                  <div className="retro-border border-zinc-800 p-4 bg-[#050507] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase block">Live Node Swarm</span>
                      <span className="text-base font-bold font-mono text-[#fafafa]">8 / 8 Active Nodes</span>
                    </div>
                    <Globe2 className="text-retro-green opacity-60" size={20} />
                  </div>
                </div>

                {/* Platform Capabilities & Walkthrough */}
                <div className="retro-border p-6 bg-[#0f0f11] border-zinc-800">
                  <h3 className="font-heading text-lg font-bold mb-4 uppercase tracking-wider text-retro-accent border-b border-zinc-800 pb-2 flex items-center gap-2">
                    <Terminal size={18} /> Swarm capabilities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-zinc-400 font-mono text-[11px] leading-relaxed">
                    <div className="space-y-2">
                      <span className="text-zinc-200 font-bold uppercase tracking-tight block">01 / Qualitative Analysis</span>
                      <p>
                        Scans and parses public earnings transcripts, press declarations, and web sentiment feeds to capture shifts in strategic corporate direction.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-zinc-200 font-bold uppercase tracking-tight block">02 / Quantitative Screen</span>
                      <p>
                        Extracts key operational metrics such as P/E metrics, Debt-to-Equity ratios, margins, and Year-over-Year revenue expansion to score financial stability.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <span className="text-zinc-200 font-bold uppercase tracking-tight block">03 / Value Projection</span>
                      <p>
                        Simulates valuation growth curves across a five-year projection window utilizing discounted cash flow computations under variable stress tests.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Terminal Research Logs */}
            {(status === "loading" || status === "logging" || status === "error") && (
              <div className="retro-border p-6 bg-[#050507] font-mono text-sm min-h-[300px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4 text-zinc-500 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-retro-accent animate-pulse" />
                      <span>AGENT_RUNNING: {company.toUpperCase()}</span>
                    </div>
                    <span>SHIELD_ENCRYPTED</span>
                  </div>
                  <div className="space-y-2">
                    {terminalLogs.map((log, i) => (
                      <div key={i} className="text-zinc-300">
                        <span className="text-zinc-600">[{new Date().toLocaleTimeString()}]</span> {log}
                      </div>
                    ))}
                    {status === "loading" && (
                      <div className="text-retro-accent blinking-cursor">
                        [AGENT] Gathering financial records, news feeds, and SEC filings...
                      </div>
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>
                {status === "error" && (
                  <button
                    onClick={handleReset}
                    className="mt-6 self-start retro-border bg-retro-red text-white font-bold px-6 py-2 uppercase text-xs"
                  >
                    Restart Terminal
                  </button>
                )}
              </div>
            )}

            {/* Decision & Report Display */}
            {status === "done" && result && (
              <div className="space-y-8 animate-slide-up">
                {/* Verdict Header */}
                <div
                  className={`retro-border p-8 bg-[#0f0f11] flex flex-col md:flex-row items-center justify-between gap-6 ${result.verdict === "INVEST" ? "border-retro-green shadow-retro-green" : "border-retro-red shadow-retro-red"
                    }`}
                >
                  <div>
                    <div className="text-zinc-500 font-mono text-xs uppercase mb-1">Agent Final Decision</div>
                    <h2 className="font-heading text-4xl font-black uppercase tracking-wider">
                      {company}
                    </h2>
                  </div>
                  <div
                    className={`text-5xl font-heading font-black px-10 py-5 retro-border ${result.verdict === "INVEST"
                        ? "bg-retro-green text-black border-black shadow-[4px_4px_0px_#000]"
                        : "bg-retro-red text-white border-black shadow-[4px_4px_0px_#000]"
                      }`}
                  >
                    {result.verdict}
                  </div>
                </div>

                {/* Valuation Projection Chart */}
                {result.projections && result.projections.length > 0 && (
                  <div className="retro-border p-6 bg-[#0f0f11]">
                    <h3 className="font-heading text-xl font-bold mb-6 uppercase border-b border-zinc-800 pb-2">
                      5-Year Valuation Growth projection
                    </h3>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="w-full md:w-2/3 flex justify-center bg-[#050507] p-4 retro-border border-zinc-800">
                        {(() => {
                          const chart = getSvgPath(result.projections);
                          const strokeColor = result.verdict === "INVEST" ? "var(--retro-green)" : "var(--retro-red)";
                          return (
                            <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="w-full max-w-[500px]">
                              {/* Grid lines */}
                              <line x1="30" y1="30" x2="470" y2="30" stroke="#222" strokeDasharray="4" />
                              <line x1="30" y1="90" x2="470" y2="90" stroke="#222" strokeDasharray="4" />
                              <line x1="30" y1="150" x2="470" y2="150" stroke="#222" strokeDasharray="4" />

                              {/* Trend path */}
                              <path
                                d={chart.pathData}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="4"
                                strokeLinecap="round"
                              />

                              {/* Connectors & Nodes */}
                              {chart.points.map((p, idx) => (
                                <g key={idx}>
                                  <rect
                                    x={p.x - 5}
                                    y={p.y - 5}
                                    width="10"
                                    height="10"
                                    fill={strokeColor}
                                    stroke="#000"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x={p.x}
                                    y={p.y - 12}
                                    fill="#fff"
                                    fontSize="10"
                                    fontFamily="monospace"
                                    textAnchor="middle"
                                  >
                                    Y{idx}: {p.val}
                                  </text>
                                </g>
                              ))}
                            </svg>
                          );
                        })()}
                      </div>
                      <div className="w-full md:w-1/3 flex flex-col justify-center">
                        <h4 className="font-mono text-xs text-zinc-500 uppercase mb-2">Simulation Summary</h4>
                        <p className="text-sm text-gray-400 font-mono leading-relaxed">
                          A Discounted Cash Flow (DCF) model simulation indicating potential equity valuation adjustments over a 5-year trajectory based on current margins.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rationale & Executive Summary */}
                <div className="retro-border p-6 bg-[#0f0f11]">
                  <h3 className="font-heading text-xl font-bold mb-4 uppercase border-b border-zinc-800 pb-2">
                    Executive Rationale
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-base">
                    {result.reasoning}
                  </p>
                </div>

                {/* Financial Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {result.metrics.map((metric, i) => (
                    <div key={i} className="retro-border p-4 bg-[#0f0f11] flex flex-col justify-between">
                      <div>
                        <div className="text-zinc-500 font-mono text-xs uppercase mb-2">{metric.name}</div>
                        <div className="text-3xl font-heading font-black tracking-tight">{metric.value}</div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-mono uppercase">
                        {metric.status === "good" && (
                          <span className="text-retro-green flex items-center gap-1">
                            <CheckCircle2 size={12} /> Healthy
                          </span>
                        )}
                        {metric.status === "bad" && (
                          <span className="text-retro-red flex items-center gap-1">
                            <AlertTriangle size={12} /> Concern
                          </span>
                        )}
                        {metric.status === "neutral" && (
                          <span className="text-zinc-400">Neutral</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Moats & Vulnerabilities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Strengths */}
                  <div className="retro-border p-6 bg-[#0f0f11] border-retro-green/40">
                    <h4 className="font-heading text-lg font-bold mb-4 uppercase text-retro-green flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <TrendingUp size={18} /> Strengths & Moats
                    </h4>
                    <ul className="space-y-3">
                      {result.strengths.map((str, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-retro-green font-bold">✓</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risks */}
                  <div className="retro-border p-6 bg-[#0f0f11] border-retro-red/40">
                    <h4 className="font-heading text-lg font-bold mb-4 uppercase text-retro-red flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <TrendingDown size={18} /> Vulnerabilities & Risks
                    </h4>
                    <ul className="space-y-3">
                      {result.weaknesses.map((risk, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-retro-red font-bold">⚠</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Interactive Analyst Follow-Up Chatbot */}
                <div className="retro-border p-6 bg-[#0f0f11]">
                  <h3 className="font-heading text-xl font-bold mb-4 uppercase border-b border-zinc-800 pb-2 flex items-center gap-2">
                    <Bot size={20} className="text-retro-accent" /> Chat with Expert Analyst
                  </h3>
                  <div className="flex flex-col h-[300px] border border-zinc-800 bg-[#050507] rounded overflow-hidden">
                    {/* Chat Messages */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                      {chatMessages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 font-mono text-xs gap-1.5">
                          <Bot size={32} className="text-retro-accent animate-pulse" />
                          <p>Ask follow-up questions about the {company} report.</p>
                        </div>
                      )}
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 p-3 rounded text-sm ${msg.role === "user"
                              ? "bg-[#16161a] border border-zinc-800 ml-12 self-end"
                              : "bg-[#1e1e24] border border-zinc-800 mr-12"
                            }`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {msg.role === "user" ? (
                              <User size={16} className="text-retro-secondary" />
                            ) : (
                              <Bot size={16} className="text-retro-accent" />
                            )}
                          </div>
                          <div className="flex-grow whitespace-pre-wrap">
                            {msg.parts
                              ? msg.parts
                                .filter((part: any) => part.type === "text")
                                .map((part: any) => part.text)
                                .join("")
                              : (msg as any).content}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex gap-3 p-3 rounded text-sm bg-[#1e1e24] border border-zinc-800 mr-12">
                          <Loader2 size={16} className="text-retro-accent animate-spin" />
                          <span className="text-zinc-500 font-mono text-xs">Analyst is thinking...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!chatInput.trim()) return;
                        const currentInput = chatInput;
                        setChatInput("");
                        await sendMessage({
                          text: currentInput,
                        }, {
                          body: {
                            companyName: company,
                            companyData: result,
                          },
                        });
                      }}
                      className="border-t border-[#333] p-3 flex gap-3 bg-[#0f0f11]"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask follow-up questions..."
                        className="flex-grow bg-[#050507] border border-zinc-700 px-3 py-2 rounded text-sm text-foreground focus:outline-none focus:border-retro-accent font-mono"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !chatInput}
                        className="retro-border bg-retro-accent text-black px-4 py-2 font-bold text-xs uppercase tracking-wider hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                      >
                        <Send size={12} /> Send
                      </button>
                    </form>
                  </div>
                </div>

                {/* Interactive Investment & Projection Calculator */}
                <div className="retro-border p-6 bg-[#0f0f11] border-zinc-700">
                  <h3 className="font-heading text-xl font-bold mb-4 uppercase border-b border-zinc-800 pb-2 flex items-center gap-2">
                    <Calculator size={20} className="text-retro-accent" /> Portfolio & Projections Calculator
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Calculator Controls */}
                    <div className="lg:col-span-5 space-y-5 font-mono text-xs">
                      <div>
                        <span className="text-zinc-500 uppercase block mb-2 font-bold">Investment Strategy</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setCalcMode("sip")}
                            className={`flex-1 py-2 retro-border text-center font-bold transition-all uppercase text-[11px] ${calcMode === "sip" ? "bg-retro-accent text-black border-black" : "bg-[#050507] text-zinc-400 border-zinc-700 hover:text-white"
                              }`}
                          >
                            SIP (Monthly)
                          </button>
                          <button
                            type="button"
                            onClick={() => setCalcMode("lumpSum")}
                            className={`flex-1 py-2 retro-border text-center font-bold transition-all uppercase text-[11px] ${calcMode === "lumpSum" ? "bg-retro-accent text-black border-black" : "bg-[#050507] text-zinc-400 border-zinc-700 hover:text-white"
                              }`}
                          >
                            Lump Sum
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-zinc-500 uppercase block mb-1 font-bold">Initial Principal</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-2 text-zinc-500">₹</span>
                            <input
                              type="number"
                              value={calcPrincipal}
                              onChange={(e) => setCalcPrincipal(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full bg-[#050507] border border-zinc-700 pl-6 pr-2 py-1.5 text-foreground focus:outline-none focus:border-retro-accent"
                            />
                          </div>
                        </div>

                        {calcMode === "sip" && (
                          <div>
                            <label className="text-zinc-500 uppercase block mb-1 font-bold">Monthly SIP</label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-zinc-500">₹</span>
                              <input
                                type="number"
                                value={calcMonthly}
                                onChange={(e) => setCalcMonthly(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full bg-[#050507] border border-zinc-700 pl-6 pr-2 py-1.5 text-foreground focus:outline-none focus:border-retro-accent"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-zinc-500 uppercase font-bold">Target Horizon ({calcYears} Years)</label>
                          <span className="text-retro-accent font-bold">5 - 10 Years Range</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="10"
                          value={calcYears}
                          onChange={(e) => setCalcYears(parseInt(e.target.value))}
                          className="w-full accent-retro-accent cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-zinc-500 uppercase font-bold">Expected CAGR ({calcGrowth}%)</label>
                          <span className="text-zinc-500 text-[10px] uppercase">Auto-calculated from report</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="40"
                          value={calcGrowth}
                          onChange={(e) => setCalcGrowth(parseInt(e.target.value))}
                          className="w-full accent-retro-accent cursor-pointer"
                        />
                      </div>

                      <div>
                        <span className="text-zinc-500 uppercase block mb-2 font-bold">Market Stress-Test</span>
                        <div className="flex gap-2">
                          {[
                            { id: "bear", label: "Bear (-6%)", color: "hover:border-retro-red" },
                            { id: "base", label: "Base Case", color: "hover:border-retro-accent" },
                            { id: "bull", label: "Bull (+5%)", color: "hover:border-retro-green" }
                          ].map((profile) => (
                            <button
                              key={profile.id}
                              type="button"
                              onClick={() => setCalcRiskProfile(profile.id as any)}
                              className={`flex-1 py-1.5 retro-border text-center text-[10px] font-bold uppercase transition-all ${calcRiskProfile === profile.id
                                  ? "bg-zinc-800 text-white border-zinc-500"
                                  : `bg-[#050507] text-zinc-500 border-zinc-850 ${profile.color}`
                                }`}
                            >
                              {profile.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-zinc-850 pt-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px]">
                          <input
                            type="checkbox"
                            checked={calcInflationAdjusted}
                            onChange={(e) => setCalcInflationAdjusted(e.target.checked)}
                            className="rounded border-zinc-700 bg-black text-retro-accent focus:ring-0"
                          />
                          <span className="text-zinc-300 uppercase font-bold">Adjust for Inflation</span>
                        </label>
                        {calcInflationAdjusted && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-zinc-500 text-[10px] uppercase">Annual Inflation Rate:</span>
                            <div className="relative w-20">
                              <input
                                type="number"
                                value={calcInflationRate}
                                onChange={(e) => setCalcInflationRate(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full bg-[#050507] border border-zinc-700 px-2 py-1 text-center text-foreground focus:outline-none"
                              />
                              <span className="absolute right-2 top-1 text-zinc-500 text-[10px]">%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Projections Display Panel */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="retro-border border-zinc-800 p-3 bg-[#050507]">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase block">Total Invested</span>
                          <span className="text-lg font-bold font-mono text-zinc-100">₹{calcResults.totalInvested.toLocaleString()}</span>
                        </div>
                        <div className="retro-border border-zinc-800 p-3 bg-[#050507]">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase block">Future Value</span>
                          <span className="text-lg font-bold font-mono text-retro-accent">₹{calcResults.finalValue.toLocaleString()}</span>
                        </div>
                        <div className="retro-border border-zinc-800 p-3 bg-[#050507]">
                          <span className="text-[10px] text-zinc-500 font-mono uppercase block">Wealth Created</span>
                          <span className="text-lg font-bold font-mono text-retro-green">₹{calcResults.wealthCreated.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Timeline Table (Past 5 Years -> Future 10 Years) */}
                      <div className="retro-border border-zinc-800 bg-[#050507] p-4 flex-grow overflow-y-auto max-h-[160px] font-mono text-[10px] space-y-1 scrollbar-thin">
                        <div className="grid grid-cols-3 border-b border-zinc-800 pb-1.5 mb-1.5 text-zinc-500 font-bold uppercase">
                          <span>Timeline Stage</span>
                          <span className="text-right">Total Invested</span>
                          <span className="text-right text-retro-accent">Projected Value</span>
                        </div>
                        {calcResults.historical.map((item, idx) => (
                          <div key={`h-${idx}`} className="grid grid-cols-3 text-zinc-500 py-0.5">
                            <span className="flex items-center gap-1">⏱ Year {item.year} (Historical)</span>
                            <span className="text-right">₹{item.invested.toLocaleString()}</span>
                            <span className="text-right">₹{item.value.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="grid grid-cols-3 text-zinc-100 py-0.5 border-y border-zinc-800/40 my-1 bg-zinc-900/30">
                          <span className="font-bold">🏁 Present Year 0</span>
                          <span className="text-right">₹{calcPrincipal.toLocaleString()}</span>
                          <span className="text-right font-bold">₹{calcPrincipal.toLocaleString()}</span>
                        </div>
                        {calcResults.future.map((item, idx) => (
                          <div key={`f-${idx}`} className="grid grid-cols-3 text-zinc-300 py-0.5">
                            <span className="text-retro-accent">🚀 Year +{item.year} (Projected)</span>
                            <span className="text-right">₹{item.invested.toLocaleString()}</span>
                            <span className="text-right text-retro-green font-bold">₹{item.value.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Extra Investment Allocations & Verdict Integration */}
                      <div className="retro-border border-zinc-800 p-4 bg-[#0c0c0e]/80 space-y-3 font-mono text-[11px]">
                        <span className="text-zinc-200 uppercase font-bold flex items-center gap-1.5">
                          <Scale size={14} className="text-retro-accent" /> Premium Investment Recommendation
                        </span>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block mb-1">Set Your Risk Profile</span>
                            <div className="flex gap-1.5">
                              {["conservative", "moderate", "aggressive"].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setCalcPortfolioRisk(p as any)}
                                  className={`px-2 py-0.5 border rounded text-[9px] uppercase font-bold transition-all ${calcPortfolioRisk === p
                                      ? "bg-retro-accent text-black border-black"
                                      : "bg-transparent border-zinc-700 text-zinc-400 hover:text-white"
                                    }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <span className="text-[10px] text-zinc-500 uppercase block">Recommended Allocation</span>
                            <span className="text-base font-bold text-retro-accent flex items-center justify-end gap-1">
                              {getRecommendedAllocation()}% <span className="text-[10px] text-zinc-400">of portfolio</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-zinc-500 leading-normal border-t border-zinc-800 pt-2 flex items-start gap-1">
                          <span className="text-retro-accent font-bold">NOTE:</span>
                          <p>
                            Based on InsideIIM Capital's official <span className={`font-bold ${result.verdict === "INVEST" ? "text-retro-green" : "text-retro-red"}`}>{result.verdict}</span> verdict for {company.toUpperCase()}, this recommendation is optimized for a {calcPortfolioRisk} strategy. Allocations are simulated limits to manage downside risk.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset Action */}
                <div className="flex gap-4">
                  <button
                    onClick={handleReset}
                    className="retro-border bg-foreground text-black font-heading font-bold px-8 py-4 uppercase tracking-wider hover:bg-zinc-200 transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={18} /> New Analysis
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="border-t border-[#333] py-8 text-center text-gray-500 font-mono text-xs">
        &copy; {new Date().getFullYear()} InsideIIM Capital // Systems Operational.
      </footer>
    </div>
  );
}
