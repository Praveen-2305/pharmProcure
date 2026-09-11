import React from 'react';
import { RiskLevel } from '../api/types';
import { Badge } from './ui/badge';
import { BadgeCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '../lib/utils';

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
      variant: 'secondary' as const,
      icon: BadgeCheck,
      label: 'Low Risk',
      colorClass: 'text-foreground',
    },
    MEDIUM: {
      variant: 'outline' as const,
      icon: AlertTriangle,
      label: 'Medium Risk',
      colorClass: 'text-foreground',
    },
    HIGH: {
      variant: 'destructive' as const,
      icon: AlertOctagon,
      label: 'High Risk',
      colorClass: '',
    },
  }[level] || {
    variant: 'secondary' as const,
    icon: AlertTriangle,
    label: level,
    colorClass: 'text-muted-foreground',
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }[size];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'font-semibold tracking-tight',
        config.colorClass,
        sizeClasses,
        className
      )}
    >
      {showIcon && <IconComponent className={cn(size === 'sm' ? 'size-3.5' : 'size-4')} />}
      {config.label}
    </Badge>
  );
};
