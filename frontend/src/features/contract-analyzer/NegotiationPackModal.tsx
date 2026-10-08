import React, { useState } from 'react';
import { NegotiationPackResponse } from '../../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  X,
  Copy,
  Check,
  Send,
  FileCheck2,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface NegotiationPackModalProps {
  pack: NegotiationPackResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const NegotiationPackModal: React.FC<NegotiationPackModalProps> = ({
  pack,
  isOpen,
  onClose,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedClauses, setCopiedClauses] = useState(false);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    const textToCopy = `Subject: ${pack.emailSubject}\n\n${pack.emailBodyDraft}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyClauses = () => {
    const textToCopy = pack.replacementClauses
      .map(
        (c, idx) =>
          `[Clause ${idx + 1}: ${c.clauseTitle}]\n` +
          `ORIGINAL: "${c.problematicOriginal}"\n` +
          `REPLACEMENT:\n${c.statutoryReplacementClause}\n` +
          `RATIONALE: ${c.rationale}\n`
      )
      .join('\n---\n\n');
    navigator.clipboard?.writeText(textToCopy);
    setCopiedClauses(true);
    setTimeout(() => setCopiedClauses(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <FileCheck2 className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                Automated Redline & Negotiation Pack
              </h2>
              <p className="text-xs text-muted-foreground">
                Generated counter-proposals for {pack.vendorName} • {pack.contractTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Email Draft Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                <Send className="size-3.5 text-primary" />
                <span>Executive Counsel Outreach Draft</span>
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                className="h-7 text-xs gap-1.5"
              >
                {copiedEmail ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                <span>{copiedEmail ? 'Copied Draft' : 'Copy Email Text'}</span>
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-background border border-border/80 font-mono text-xs space-y-3 leading-relaxed">
              <div className="text-muted-foreground pb-2 border-b border-border/50">
                <span className="font-semibold text-foreground">Subject: </span>
                {pack.emailSubject}
              </div>
              <div className="whitespace-pre-line text-foreground/90 font-sans text-xs">
                {pack.emailBodyDraft}
              </div>
            </div>
          </div>

          {/* Replacement Clauses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>Statutory Replacement Clauses ({pack.replacementClauses.length})</span>
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyClauses}
                className="h-7 text-xs gap-1.5"
              >
                {copiedClauses ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                <span>{copiedClauses ? 'Copied Clauses' : 'Copy All Clauses'}</span>
              </Button>
            </div>

            <div className="space-y-3">
              {pack.replacementClauses.map((clause, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border/70 bg-muted/20 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-foreground">
                      {idx + 1}. {clause.clauseTitle}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/40">
                      Legally Enforceable Replacement
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Problematic Original */}
                    <div className="p-3 rounded bg-rose-950/20 border border-rose-500/30">
                      <p className="text-[10px] font-mono uppercase text-rose-400 font-semibold mb-1">
                        Flagged Original Clause
                      </p>
                      <p className="font-serif italic text-rose-100/90 text-xs">
                        "{clause.problematicOriginal}"
                      </p>
                    </div>

                    {/* Statutory Replacement */}
                    <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/30">
                      <p className="text-[10px] font-mono uppercase text-emerald-400 font-semibold mb-1">
                        Proposed Statutory Remedy
                      </p>
                      <p className="text-emerald-100/90 text-xs leading-relaxed">
                        {clause.statutoryReplacementClause}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground bg-background/50 p-2 rounded border border-border/40">
                    <span className="font-semibold text-foreground">Remedial Legal Rationale: </span>
                    {clause.rationale}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Negotiation Strategy Tips */}
          {pack.negotiationStrategyTips && pack.negotiationStrategyTips.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                <Lightbulb className="size-4" />
                <span>Strategic Counter-Negotiation Advisory</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-100/90">
                {pack.negotiationStrategyTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/20 flex justify-end">
          <Button onClick={onClose} variant="default" size="sm" className="px-5">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
