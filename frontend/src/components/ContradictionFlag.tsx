import React, { useState } from 'react';
import { RankedFact } from '../api/types';
import { cn } from '../lib/utils';
import { GitCompare, AlertTriangle, X, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface ContradictionFlagProps {
  fact: RankedFact;
  allFacts?: RankedFact[];
  className?: string;
}

export const ContradictionFlag: React.FC<ContradictionFlagProps> = ({
  fact,
  allFacts = [],
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Find the conflicting counter-fact if available
  const conflictingFact = fact.conflictsWith
    ? allFacts.find((f) => f.factId === fact.conflictsWith)
    : null;

  const primaryFact = fact.isPrimary ? fact : conflictingFact || fact;
  const secondaryFact = !fact.isPrimary ? fact : conflictingFact;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
          'bg-rose-950/80 border border-rose-500/60 text-rose-300 hover:bg-rose-900 transition-colors shadow-sm cursor-pointer',
          className
        )}
        title="Click to inspect hybrid RAG conflicting evidence"
      >
        <GitCompare className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
        <span className="font-semibold tracking-wide">Fusion Contradiction Flagged</span>
        <span className="text-[10px] bg-rose-900/90 text-rose-200 px-1 py-0.2 rounded border border-rose-700/50">
          Inspect
        </span>
      </button>

      {/* Side-by-Side Modal / Flyout for Hybrid RAG Conflict Analysis */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 shadow-2xl overflow-hidden text-left relative">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    Hybrid RAG Contradiction Resolution
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300">
                      POC §3.3 Mechanism
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Vector and Knowledge Graph retrievers returned irreconcilable claims. Primary fact selected via source-priority weighting.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              {/* Primary Selected Fact */}
              <div className="rounded-lg border border-teal-500/40 bg-teal-950/20 p-4 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      <Sparkles className="w-3 h-3" /> Selected Primary
                    </span>
                    <span className="text-xs font-mono text-slate-400 capitalize">
                      Source: <strong className="text-white">{primaryFact?.source}</strong>
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-sans leading-relaxed my-2">
                    "{primaryFact?.text}"
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-teal-900/60 text-xs font-mono space-y-1 bg-slate-950/40 p-2.5 rounded">
                  <div className="flex justify-between text-slate-400">
                    <span>Retriever Similarity:</span>
                    <span className="text-slate-200">{(primaryFact?.retrieverScore ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Source Priority Weight:</span>
                    <span className="text-teal-400 font-bold">{(primaryFact?.sourceWeight ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-semibold">
                    <span>Final Composite Score:</span>
                    <span className="text-teal-300">{(primaryFact?.finalScore ?? 0).toFixed(3)}</span>
                  </div>
                </div>
              </div>

              {/* Runner-up Conflicting Fact */}
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/20 p-4 relative flex flex-col justify-between opacity-85 hover:opacity-100 transition">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" /> Contradicted Runner-Up
                    </span>
                    <span className="text-xs font-mono text-slate-400 capitalize">
                      Source: <strong className="text-white">{secondaryFact?.source || 'vector'}</strong>
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 font-sans leading-relaxed my-2">
                    "{secondaryFact?.text || 'No counter-claim text available in citation register.'}"
                  </p>
                </div>

                {secondaryFact && (
                  <div className="mt-4 pt-3 border-t border-rose-900/60 text-xs font-mono space-y-1 bg-slate-950/40 p-2.5 rounded">
                    <div className="flex justify-between text-slate-400">
                      <span>Retriever Similarity:</span>
                      <span className="text-slate-200">{(secondaryFact.retrieverScore).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Source Priority Weight:</span>
                      <span className="text-slate-300 font-bold">{(secondaryFact.sourceWeight).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800 font-semibold">
                      <span>Final Composite Score:</span>
                      <span className="text-rose-400 font-mono">{(secondaryFact.finalScore).toFixed(3)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rationale Explanation */}
            <div className="mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-100 font-medium">Resolution Rationale: </strong>
                The platform does not arbitrarily drop conflicting statements. Government-backed Knowledge Graph nodes (FDA enforcement data) carry higher authoritative source weights ({primaryFact?.sourceWeight}) than unverified self-disclosed vector attachments ({secondaryFact?.sourceWeight}), producing a superior composite ranking score ({primaryFact?.finalScore.toFixed(3)} vs {secondaryFact?.finalScore.toFixed(3)}).
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition"
              >
                Dismiss Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
