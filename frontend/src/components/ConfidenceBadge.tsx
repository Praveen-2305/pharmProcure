import React from 'react';
import { cn } from '../lib/utils';
import { Database, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number; // 0.0 to 1.0
  className?: string;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  className,
  showProgress = false,
  size = 'md',
}) => {
  // Score normalization: 0 - 100%
  const percentage = Math.round(Math.min(Math.max(score, 0), 1) * 100);

  // Decoupled palette: using indigo, cyan, slate (Strictly avoiding Green/Amber/Red risk severity tokens)
  const getBadgeStyle = () => {
    if (percentage >= 85) {
      return {
        bg: 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200',
        bar: 'bg-indigo-400',
        badgeText: 'Robust Evidence',
      };
    }
    if (percentage >= 70) {
      return {
        bg: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-200',
        bar: 'bg-cyan-400',
        badgeText: 'Adequate Evidence',
      };
    }
    return {
      bg: 'bg-slate-800/80 border-slate-600 text-slate-300',
      bar: 'bg-slate-400',
      badgeText: 'Sparse Evidence',
    };
  };

  const style = getBadgeStyle();

  return (
    <div
      className={cn(
        'inline-flex flex-col gap-1 rounded-lg border px-3 py-1.5 backdrop-blur-sm shadow-sm',
        style.bg,
        className
      )}
      title="Evidence completeness score indicates the breadth and depth of cross-verified source documents, independent of risk severity."
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide">
          <Database className="w-3.5 h-3.5 opacity-80" />
          <span className="text-slate-400">Evidence Completeness:</span>
          <span className="font-mono font-semibold text-slate-100">{percentage}%</span>
        </div>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50 text-slate-300">
          {style.badgeText}
        </span>
      </div>

      {showProgress && (
        <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', style.bar)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
};
