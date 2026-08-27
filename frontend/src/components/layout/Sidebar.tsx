import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus2,
  CheckSquare,
  FileText,
  AlertOctagon,
  HelpCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const navItems = [
    {
      to: '/',
      label: 'Audit Dashboard',
      icon: LayoutDashboard,
      description: 'Historical cases & audit trail',
    },
    {
      to: '/submit',
      label: 'Submit Request',
      icon: FilePlus2,
      description: 'New vendor investigation',
    },
    {
      to: '/queue',
      label: 'Approval Queue',
      icon: CheckSquare,
      description: 'Pending human authorization',
    },
  ];

  const quickCases = [
    {
      id: 'seed-clean-biogen',
      label: 'Clean Pass (BioGen)',
      tag: 'Low Risk',
      tagColor: 'text-emerald-400 border-emerald-800 bg-emerald-950/40',
    },
    {
      id: 'seed-contradiction-medisupply',
      label: 'Contradiction Case',
      tag: 'Flagged',
      tagColor: 'text-rose-400 border-rose-800 bg-rose-950/40',
    },
    {
      id: 'seed-indeterminate-phytochem',
      label: 'Indeterminate Price',
      tag: 'Missing Ref',
      tagColor: 'text-cyan-400 border-cyan-800 bg-cyan-950/40',
    },
    {
      id: 'seed-exceeds-ceiling-nanopharma',
      label: 'Exceeds Ceiling',
      tag: 'Over Budget',
      tagColor: 'text-amber-400 border-amber-800 bg-amber-950/40',
    },
    {
      id: 'seed-failure-missing-vendor',
      label: 'Failed Vendor Lookup',
      tag: 'Terminated',
      tagColor: 'text-slate-400 border-slate-700 bg-slate-800/40',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Workflows
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-teal-400" />
                  <div className="flex flex-col text-left">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">
                      {item.description}
                    </span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Quick Seed Review Benchmarks */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Demo Scenarios
            </span>
            <Layers className="w-3 h-3 text-slate-400" />
          </div>
          <div className="space-y-1">
            {quickCases.map((qc) => (
              <NavLink
                key={qc.id}
                to={`/review/${qc.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group',
                    isActive
                      ? 'bg-slate-800 text-white font-medium border border-slate-700'
                      : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/40'
                  )
                }
              >
                <div className="truncate max-w-[130px]">{qc.label}</div>
                <span
                  className={cn(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase',
                    qc.tagColor
                  )}
                >
                  {qc.tag}
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-950/40 space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-400">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          <span>LangGraph Architecture</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          Planner → Executor → Risk Scorer → Critic Loop → Report Writer → Approval.
        </p>
      </div>
    </aside>
  );
};
