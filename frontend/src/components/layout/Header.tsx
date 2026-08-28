import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { isMockMode } from '../../api/client';
import { Shield, Sparkles, Bell, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-200">
            <Shield className="h-4 w-4 text-white font-bold" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            Autono<span className="text-teal-600">Source</span>
          </span>
        </div>
        <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-mono tracking-widest rounded bg-slate-100 border border-slate-200 text-slate-500">
          v2.0 Multi-Agent RAG
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live System Active
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          <span>Graph + Vector Fusion Active</span>
        </div>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-800">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">{user.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-teal-50 border-2 border-teal-400 flex items-center justify-center text-teal-700 text-xs font-bold font-mono">
            {user.avatarInitials}
          </div>
        </div>
      </div>
    </header>
  );
};
