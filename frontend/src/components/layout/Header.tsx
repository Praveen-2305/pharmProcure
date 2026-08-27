import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { isMockMode } from '../../api/client';
import { Shield, Sparkles, Bell, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-900/30">
            <Shield className="h-4 w-4 text-slate-950 font-bold" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            Autono<span className="text-teal-400">Source</span>
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest rounded bg-slate-800 border border-slate-700 text-slate-300">
          v2.0 Multi-Agent RAG
        </span>
        {isMockMode && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Mock Data Mode
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60 gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Graph + Vector Fusion Active</span>
        </div>

        <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">{user.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-teal-500/40 flex items-center justify-center text-teal-300 text-xs font-bold font-mono">
            {user.avatarInitials}
          </div>
        </div>
      </div>
    </header>
  );
};
