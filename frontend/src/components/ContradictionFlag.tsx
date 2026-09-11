import React from 'react';
import { RankedFact } from '../api/types';
import { cn } from '../lib/utils';
import { GitCompare, AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { Card } from './ui/card';

interface ContradictionFlagProps {
  fact: RankedFact;
  allFacts?: RankedFact[];
  className?: string;
}

export const ContradictionFlag: React.FC<ContradictionFlagProps> = ({
  fact,
  allFacts = [],
  className,
}) => {
  const conflictingFact = fact.conflictsWith
    ? allFacts.find((f) => f.factId === fact.conflictsWith)
    : null;

  const primaryFact = fact.isPrimary ? fact : conflictingFact || fact;
  const secondaryFact = !fact.isPrimary ? fact : conflictingFact;

  return (
    <Dialog>
      <DialogTrigger 
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'gap-1.5 h-7 px-2.5 text-xs font-medium bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive',
              className
            )}
            title="Click to inspect hybrid RAG conflicting evidence"
          />
        }
      >
        <GitCompare className="size-3.5 animate-pulse" />
        <span className="font-semibold tracking-wide">Fusion Contradiction</span>
        <Badge variant="destructive" className="h-4 px-1 py-0 text-[10px] rounded-sm ml-1">
          Inspect
        </Badge>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                Hybrid RAG Contradiction Resolution
                <Badge variant="outline" className="font-normal bg-destructive/5 text-destructive border-destructive/20">
                  Arbitration Protocol §3.3
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Vector and Knowledge Graph retrievers returned irreconcilable claims. Primary fact selected via source-priority weighting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {/* Primary Selected Fact */}
          <Card className="p-4 relative flex flex-col justify-between border-primary/20 bg-primary/5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="default" className="gap-1 text-xs">
                  <Sparkles className="size-3" /> Selected Primary
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">
                  Source: <strong className="text-foreground">{primaryFact?.source}</strong>
                </span>
              </div>
              <p className="text-sm text-foreground/90 font-sans leading-relaxed my-2">
                "{primaryFact?.text}"
              </p>
            </div>

            <div className="mt-4 pt-3 border-t text-xs space-y-1 bg-background/50 p-2.5 rounded border-border">
              <div className="flex justify-between text-muted-foreground">
                <span>Retriever Similarity:</span>
                <span className="text-foreground">{(primaryFact?.retrieverScore ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Source Priority Weight:</span>
                <span className="text-primary font-bold">{(primaryFact?.sourceWeight ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-foreground pt-1 border-t font-semibold">
                <span>Final Composite Score:</span>
                <span className="text-primary">{(primaryFact?.finalScore ?? 0).toFixed(3)}</span>
              </div>
            </div>
          </Card>

          {/* Runner-up Conflicting Fact */}
          <Card className="p-4 relative flex flex-col justify-between border-destructive/20 bg-destructive/5 opacity-85 hover:opacity-100 transition">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="size-3" /> Contradicted Runner-Up
                </Badge>
                <span className="text-xs text-muted-foreground capitalize">
                  Source: <strong className="text-foreground">{secondaryFact?.source || 'vector'}</strong>
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-sans leading-relaxed my-2">
                "{secondaryFact?.text || 'No counter-claim text available in citation register.'}"
              </p>
            </div>

            {secondaryFact && (
              <div className="mt-4 pt-3 border-t text-xs space-y-1 bg-background/50 p-2.5 rounded border-border">
                <div className="flex justify-between text-muted-foreground">
                  <span>Retriever Similarity:</span>
                  <span className="text-foreground">{(secondaryFact.retrieverScore).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Source Priority Weight:</span>
                  <span className="text-foreground font-bold">{(secondaryFact.sourceWeight).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground pt-1 border-t font-semibold">
                  <span>Final Composite Score:</span>
                  <span className="text-destructive">{(secondaryFact.finalScore).toFixed(3)}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="p-3 rounded-lg bg-muted/50 border text-xs text-muted-foreground flex items-start gap-2.5">
          <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground font-medium">Resolution Rationale: </strong>
            The platform does not arbitrarily drop conflicting statements. Government-backed Knowledge Graph nodes (FDA enforcement data) carry higher authoritative source weights ({primaryFact?.sourceWeight}) than unverified self-disclosed vector attachments ({secondaryFact?.sourceWeight}), producing a superior composite ranking score ({primaryFact?.finalScore?.toFixed(3)} vs {secondaryFact?.finalScore?.toFixed(3)}).
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Dismiss Resolution
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
