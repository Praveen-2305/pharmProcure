import React from 'react';
import { RiskLevel } from '../api/types';
import { cn } from '../lib/utils';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskLevelTagProps {
  level: RiskLevel;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskLevelTag: React.FC<RiskLevelTagProps> = ({
  level,
  className,
  showIcon = true,
  size = 'md',
}) => {
  const config = {
    LOW: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: ShieldCheck,
      label: 'Low Risk',
      dot: 'bg-emerald-500',
    },
    MEDIUM: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertTriangle,
      label: 'Medium Risk',
      dot: 'bg-amber-500',
    },
    HIGH: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: AlertOctagon,
      label: 'High Risk',
      dot: 'bg-rose-500',
    },
  }[level] || {
    bg: 'bg-slate-100 border-slate-200 text-slate-600',
    icon: AlertTriangle,
    label: level,
    dot: 'bg-slate-400',
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs tracking-wide uppercase font-semibold gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm font-semibold gap-2',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-medium transition-colors shadow-sm',
        config.bg,
        sizeClasses,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', config.dot)} />
      {showIcon && <IconComponent className={cn(size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />}
      <span>{config.label}</span>
    </span>
  );
};
