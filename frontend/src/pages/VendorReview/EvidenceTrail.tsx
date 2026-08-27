import React from 'react';
import { RankedContext, RankedFact } from '../../api/types';
import { ContradictionFlag } from '../../components/ContradictionFlag';
import { Network, Database, Layers, Sparkles, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EvidenceTrailProps {
  fusedContext: RankedContext;
}

export const EvidenceTrail: React.FC<EvidenceTrailProps> = ({ fusedContext }) => {
  const { facts, fallbackToVectorOnly } = fusedContext;

  // Sorted by finalScore descending per POC §3.3 spec
  const sortedFacts = [...facts].sort((a, b) => b.finalScore - a.finalScore);

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            Verifiable Evidence Trail & Hybrid Fusion
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked cross-source citations with mathematical weights and contradiction resolution.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
            <Network className="w-3 h-3 text-cyan-400" /> Graph Nodes
          </span>
          <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
            <Database className="w-3 h-3 text-indigo-400" /> Vector Chunks
          </span>
        </div>
      </div>

      {/* Fallback to Vector Note (POC §3.3) */}
      {fallbackToVectorOnly && (
        <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-100">Fallback Notice: </strong>
            Knowledge graph entity traversal yielded no connected subgraph for this specialized scope. Retrieval automatically defaulted to Vector-Only semantic similarity without halting the workflow.
          </div>
        </div>
      )}

      {/* Ranked Facts List */}
      <div className="space-y-3">
        {sortedFacts.map((fact, index) => {
          const isGraph = fact.source === 'graph';

          return (
            <div
              key={fact.factId}
              className={cn(
                'rounded-xl border p-4 transition-all',
                fact.contradictionFlag
                  ? 'bg-rose-950/10 border-rose-500/40 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  {/* Metadata Header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                      #{index + 1}
                    </span>

                    {/* Source Badge */}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border uppercase font-medium',
                        isGraph
                          ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                          : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                      )}
                    >
                      {isGraph ? <Network className="w-3 h-3" /> : <Database className="w-3 h-3 text-indigo-400" />}
                      {fact.source} Retriever
                    </span>

                    {fact.isPrimary && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-600/50 text-teal-300">
                        Primary Citation
                      </span>
                    )}

                    {/* Contradiction Flag Pill */}
                    {fact.contradictionFlag && (
                      <ContradictionFlag fact={fact} allFacts={facts} />
                    )}
                  </div>

                  {/* Fact text */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {fact.text}
                  </p>
                </div>

                {/* Score breakdown metrics */}
                <div className="shrink-0 bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-lg text-left font-mono text-[11px] space-y-1 min-w-[170px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Similarity:</span>
                    <span className="text-slate-200">{(fact.retrieverScore).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Source Weight:</span>
                    <span className="text-teal-400 font-semibold">{(fact.sourceWeight).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-semibold">
                    <span>Composite:</span>
                    <span className="text-teal-300">{fact.finalScore.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
