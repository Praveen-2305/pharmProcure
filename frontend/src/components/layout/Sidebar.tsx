import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardCheck,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { buttonVariants } from '../ui/button';

export const Sidebar: React.FC<{ isOpen?: boolean }> = ({ isOpen = true }) => {
  const navItems = [
    {
      to: '/dashboard',
      label: 'Audit Dashboard',
      icon: LayoutDashboard,
      description: 'Historical cases & audit trail',
    },
    {
      to: '/submit',
      label: 'Submit Request',
      icon: PlusCircle,
      description: 'New vendor investigation',
    },
    {
      to: '/queue',
      label: 'Approval Queue',
      icon: ClipboardCheck,
      description: 'Pending human authorization',
    },
  ];

  const quickCases = [
    {
      id: 'PR-2026-8801-BIO',
      label: 'BioGen Diagnostics',
      variant: 'secondary' as const,
    },
    {
      id: 'PR-2026-8802-MSI',
      label: 'MediSupply Global',
      variant: 'secondary' as const,
    },
    {
      id: 'PR-2026-8803-PCT',
      label: 'PhytoChem Research',
      variant: 'secondary' as const,
    },
    {
      id: 'PR-2026-8804-NPH',
      label: 'NanoPharma Corp',
      variant: 'secondary' as const,
    },
    {
      id: 'PR-2026-8805-UKN',
      label: 'Apex BioLogistics',
      variant: 'secondary' as const,
    },
  ];

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out shrink-0 h-full overflow-hidden",
        isOpen ? "w-[320px] min-w-[300px] max-w-[500px] resize-x opacity-100 translate-x-0" : "w-0 min-w-0 opacity-0 -translate-x-12 !resize-none"
      )}
    >
      <aside className="w-full border-r bg-background flex flex-col justify-between h-full overflow-y-auto overflow-x-hidden">
        <div className="p-5 space-y-6 w-full">
        <div>
          <div className="px-3 mb-4 text-[15px] font-semibold text-foreground tracking-tight">
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
                        "w-full flex items-center gap-3 px-3 py-2 text-[15px] rounded-lg font-medium transition-colors duration-150",
                        isActive
                          ? "bg-secondary text-foreground font-semibold shadow-xs border border-border/40"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )
                    }
                  >
                    <Icon className="size-4.5 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Priority Case Ledger */}
        <div className="pt-6 border-t">
          <div className="px-3 mb-4 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-foreground tracking-tight">
              Recent Case Files
            </span>
            <Workflow className="size-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            {quickCases.map((qc) => (
              <NavLink
                key={qc.id}
                to={`/review/${qc.id}`}
                className={({ isActive }) =>
                  cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 text-[14px] rounded-lg font-medium transition-colors duration-150",
                    isActive
                      ? "bg-secondary text-foreground font-semibold shadow-xs border border-border/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )
                }
              >
                <span className="truncate flex-1 text-left">{qc.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t text-sm bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 font-semibold text-foreground whitespace-nowrap min-w-0">
            <Workflow className="size-4 text-primary shrink-0" />
            <span className="truncate text-xs font-medium">Agent Orchestrator</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>Live</span>
          </div>
        </div>
      </div>
      </aside>
    </div>
  );
};
