"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Landmark, Terminal, Cpu, Info, BarChart3, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  return (
    <header className="relative flex items-center justify-between px-8 py-6 border-b border-[#333] z-50">
      <Link href="/" className="font-heading text-2xl font-bold tracking-tighter flex items-center gap-2">
        <Landmark className="text-retro-accent" size={24} />
        Inside<span className="text-retro-accent">IIM</span> <span className="text-zinc-600 font-mono text-sm tracking-widest">// CAPITAL</span>
      </Link>
      
      {/* Desktop Nav */}
      <nav className="hidden md:flex gap-6 font-medium">
        <Link href="/" className="hover:text-retro-accent transition-colors font-mono text-sm uppercase">Research Terminal</Link>
        <button 
          onClick={() => setIsDocsOpen(true)} 
          className="hover:text-retro-accent transition-colors font-mono text-sm uppercase cursor-pointer bg-transparent border-none text-left p-0"
        >
          Docs
        </button>
      </nav>
      
      <button className="retro-border px-5 py-2 font-bold text-sm bg-foreground text-black hidden md:block font-mono">
        SYS_STATUS: ONLINE
      </button>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden text-foreground hover:text-retro-accent transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Nav Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-background border-b border-[#333] flex flex-col px-8 py-6 gap-6 md:hidden shadow-lg z-50"
          >
            <Link href="/" className="text-xl font-bold hover:text-retro-accent transition-colors font-mono" onClick={() => setIsOpen(false)}>RESEARCH TERMINAL</Link>
            <button 
              onClick={() => {
                setIsOpen(false);
                setIsDocsOpen(true);
              }} 
              className="text-xl font-bold hover:text-retro-accent transition-colors font-mono text-left bg-transparent border-none p-0 cursor-pointer"
            >
              DOCS
            </button>
            <button className="retro-border w-full py-3 font-bold text-lg bg-foreground text-black mt-4 font-mono">
              SYS_STATUS: ONLINE
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documentation Modal Overlay */}
      <AnimatePresence>
        {isDocsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 z-50 overflow-y-auto"
            onClick={() => setIsDocsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="retro-border bg-[#0f0f11] border-2 border-zinc-700 max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <h2 className="font-heading text-2xl font-bold uppercase tracking-tight flex items-center gap-2">
                  <Terminal className="text-retro-accent" size={24} /> System Documentation
                </h2>
                <button 
                  onClick={() => setIsDocsOpen(false)}
                  className="p-1 hover:text-retro-accent transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Quick Guide */}
              <div className="space-y-4 font-mono text-xs text-zinc-300">
                <div className="border-l-2 border-retro-accent pl-3 space-y-1">
                  <span className="text-retro-accent font-bold uppercase flex items-center gap-1.5"><Info size={14} /> Overview</span>
                  <p className="leading-relaxed">
                    InsideIIM Capital utilizes a state-of-the-art multi-agent swarm architecture designed to automate corporate equity research, quantitative audit validation, and qualitative risk screening.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="retro-border border-zinc-800 p-4 bg-[#050507]">
                    <span className="text-retro-secondary font-bold uppercase flex items-center gap-1.5 mb-2"><Cpu size={14} /> Multi-Agent Swarm</span>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Individual virtual agents perform parallel scraping of earnings calls transcripts, sentiment validation on recent financial publications, and balance sheet stress tests.
                    </p>
                  </div>
                  <div className="retro-border border-zinc-800 p-4 bg-[#050507]">
                    <span className="text-retro-green font-bold uppercase flex items-center gap-1.5 mb-2"><BarChart3 size={14} /> DCF Simulator</span>
                    <p className="text-[11px] leading-relaxed text-zinc-400">
                      Calculates automated free cash flow projections over a 5-year outlook window to generate conservative enterprise value simulations based on target margins.
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4 space-y-2 mt-6">
                  <span className="text-[#fafafa] font-bold uppercase flex items-center gap-1.5"><HelpCircle size={14} /> Research Terminal Workflow</span>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-400">
                    <li>Type any corporation name or public market ticker symbol.</li>
                    <li>Observe live investigation logs stream from the research pipeline.</li>
                    <li>Inspect the generated verdict, DCF trends, and quantitative metrics.</li>
                    <li>Engage the Lead Analyst Chatbot to probe specific concerns or clarify assumptions.</li>
                    <li>Export the finalized investment dossier as clean Markdown.</li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setIsDocsOpen(false)}
                  className="retro-border px-6 py-2 bg-retro-accent text-black font-heading font-bold uppercase text-xs hover:bg-yellow-400"
                >
                  Close Console
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
