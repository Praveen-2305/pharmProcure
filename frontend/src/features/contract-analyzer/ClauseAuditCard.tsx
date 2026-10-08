import React from 'react';
import { AuditedClauseCard } from '../../api/types';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, AlertTriangle, CheckCircle2, BookOpen, ShieldAlert, Check } from 'lucide-react';

interface ClauseAuditCardProps {
  clause: AuditedClauseCard;
  isSelected?: boolean;
  onToggleSelect?: (clauseId: string) => void;
}

export const ClauseAuditCard: React.FC<ClauseAuditCardProps> = ({
  clause,
  isSelected,
  onToggleSelect,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIOLATION':
        return {
          border: 'border-rose-500/50',
          badge: 'bg-rose-600/90 text-white',
          bg: 'bg-rose-950/10',
          icon: <AlertCircle className="size-4 text-rose-400 shrink-0" />,
        };
      case 'WARNING':
        return {
          border: 'border-amber-500/50',
          badge: 'bg-amber-600/90 text-white',
          bg: 'bg-amber-950/10',
          icon: <AlertTriangle className="size-4 text-amber-400 shrink-0" />,
        };
      case 'COMPLIANT':
      default:
        return {
          border: 'border-emerald-500/40',
          badge: 'bg-emerald-600/90 text-white',
          bg: 'bg-emerald-950/10',
          icon: <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />,
        };
    }
  };

  const statusStyle = getStatusColor(clause.complianceStatus);

  return (
    <Card
      className={`border transition-all duration-200 ${statusStyle.border} ${statusStyle.bg} hover:border-primary/50`}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header line: Title + Status + Severity + Selection Checkbox */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            {statusStyle.icon}
            <div>
              <span className="text-xs font-mono text-muted-foreground mr-2">[{clause.clauseId}]</span>
              <span className="font-semibold text-sm text-foreground">{clause.clauseTitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`${statusStyle.badge} text-[11px] font-bold px-2 py-0.5`}>
              {clause.complianceStatus}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-mono uppercase">
              {clause.severity} SEVERITY
            </Badge>
            {onToggleSelect && (
              <button
                type="button"
                onClick={() => onToggleSelect(clause.clauseId)}
                className={`ml-2 px-2.5 py-1 text-xs rounded border transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
                }`}
                title="Include in Redline Negotiation Pack"
              >
                {isSelected ? <Check className="size-3" /> : null}
                <span>{isSelected ? 'Selected' : 'Select'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Extracted text snippet */}
        <div className="rounded-md bg-background/60 border border-border/60 p-3">
          <p className="text-[11px] text-muted-foreground uppercase font-mono tracking-wider mb-1">
            Audited Clause Extract
          </p>
          <p className="text-xs font-serif italic text-foreground/90 leading-relaxed">
            "{clause.extractedText}"
          </p>
        </div>

        {/* Legal Benchmarks and Statute */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-md bg-secondary/40 border border-border/40 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
              <BookOpen className="size-3.5 text-primary" />
              <span>Statute / Standard Cited</span>
            </div>
            <p className="text-foreground font-semibold text-xs">{clause.statuteCited}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{clause.legalBenchmark}</p>
          </div>

          <div className="p-3 rounded-md bg-secondary/40 border border-border/40 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
              <ShieldAlert className="size-3.5 text-amber-400" />
              <span>Automated Remedial Directive</span>
            </div>
            <p className="text-foreground text-xs leading-relaxed">{clause.recommendedRemedy}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
