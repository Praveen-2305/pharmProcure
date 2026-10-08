import React, { useState, useRef, useEffect } from 'react';
import { useAuth, PRESET_USERS, User } from '../../context/AuthContext';
import { ChevronDown, Check, UserCheck, ShieldAlert, Award } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export const RoleSwitcher: React.FC = () => {
  const { user, switchUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Procurement Officer':
        return <UserCheck className="size-3.5 text-blue-400" />;
      case 'Compliance Analyst':
        return <ShieldAlert className="size-3.5 text-amber-400" />;
      case 'Executive Approver':
        return <Award className="size-3.5 text-emerald-400" />;
      default:
        return <UserCheck className="size-3.5 text-primary" />;
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (role) {
      case 'Executive Approver':
        return 'default';
      case 'Compliance Analyst':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-lg border border-border/60 bg-background/50 hover:bg-accent/40 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-primary/40"
        title="Click to switch persona role"
      >
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-foreground leading-tight">{user.name}</p>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-[10px] text-muted-foreground">{user.role}</span>
          </div>
        </div>
        <div
          className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border border-primary/30 select-none shadow-xs"
          aria-label={`${user.name} (${user.role})`}
        >
          {user.avatarInitials}
        </div>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-border/40 mb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Switch Active Persona</p>
            <p className="text-[10px] text-muted-foreground">Test workflows across governance tiers</p>
          </div>
          <div className="space-y-1">
            {PRESET_USERS.map((preset) => {
              const isActive = preset.id === user.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    switchUser(preset);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors",
                    isActive ? "bg-primary/15 border border-primary/30" : "hover:bg-accent/50"
                  )}
                >
                  <div className="size-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {preset.avatarInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-foreground truncate">{preset.name}</span>
                      {isActive && <Check className="size-3.5 text-primary shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getRoleIcon(preset.role)}
                      <span className="text-[11px] font-mono text-muted-foreground">{preset.role}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{preset.department}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
