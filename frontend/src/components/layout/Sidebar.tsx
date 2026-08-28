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
      id: 'PR-2026-8801-BIO',
      label: 'BioGen Diagnostics',
      tag: 'Low Risk',
      tagColor: 'text-emerald-700 border-emerald-300 bg-emerald-50',
    },
    {
      id: 'PR-2026-8802-MSI',
      label: 'MediSupply Global',
      tag: 'Flagged',
      tagColor: 'text-rose-700 border-rose-300 bg-rose-50',
    },
    {
      id: 'PR-2026-8803-PCT',
      label: 'PhytoChem Research',
      tag: 'Custom Price',
      tagColor: 'text-cyan-700 border-cyan-300 bg-cyan-50',
    },
    {
      id: 'PR-2026-8804-NPH',
      label: 'NanoPharma Corp',
      tag: 'Over Ceiling',
      tagColor: 'text-amber-700 border-amber-300 bg-amber-50',
    },
    {
      id: 'PR-2026-8805-UKN',
      label: 'Apex BioLogistics',
      tag: 'Terminated',
      tagColor: 'text-slate-600 border-slate-300 bg-slate-100',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
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
                        ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent'
                    )
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-teal-500" />
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

        {/* Priority Case Ledger */}
        <div className="pt-2 border-t border-slate-200">
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Recent Case Files
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
                      ? 'bg-slate-100 text-slate-900 font-medium border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
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

      <div className="p-4 border-t border-slate-200 text-[11px] text-slate-500 bg-slate-50 space-y-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <Layers className="w-3.5 h-3.5 text-teal-500" />
          <span>LangGraph Architecture</span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          Planner → Executor → Risk Scorer → Critic Loop → Report Writer → Approval.
        </p>
      </div>
    </aside>
  );
};
