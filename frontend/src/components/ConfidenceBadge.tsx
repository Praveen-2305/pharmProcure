import React from 'react';
import { cn } from '../lib/utils';
import { Database } from 'lucide-react';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

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
  const percentage = Math.round(Math.min(Math.max(score, 0), 1) * 100);

  const getBadgeStyle = () => {
    if (percentage >= 85) return { variant: 'default' as const, badgeText: 'Robust' };
    if (percentage >= 70) return { variant: 'secondary' as const, badgeText: 'Adequate' };
    return { variant: 'outline' as const, badgeText: 'Sparse' };
  };

  const style = getBadgeStyle();

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      title="Evidence completeness score indicates the breadth and depth of cross-verified source documents."
    >
      <div className="flex items-center gap-2">
        <Database className="size-3.5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{percentage}%</span>
        <Badge variant={style.variant} className="text-xs rounded-sm px-1.5 py-0.5">
          {style.badgeText}
        </Badge>
      </div>
      {showProgress && (
        <Progress value={percentage} className="h-1.5 max-w-[120px]" />
      )}
    </div>
  );
};
