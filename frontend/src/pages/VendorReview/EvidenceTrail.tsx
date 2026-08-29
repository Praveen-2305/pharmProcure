import React from 'react';
import { RankedContext, RankedFact } from '../../api/types';
import { ContradictionFlag } from '../../components/ContradictionFlag';
import { Network, Database, Layers, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';

interface EvidenceTrailProps {
  fusedContext: RankedContext;
}

export const EvidenceTrail: React.FC<EvidenceTrailProps> = ({ fusedContext }) => {
  const { facts, fallbackToVectorOnly } = fusedContext;

  // Sorted by finalScore descending per POC §3.3 spec
  const sortedFacts = [...facts].sort((a, b) => b.finalScore - a.finalScore);

  return (
    <div className="space-y-5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            Verifiable Evidence Trail & Hybrid Fusion
          </h3>
        </div>
      </div>


      {/* Ranked Facts List */}
      <div className="space-y-4">
        {sortedFacts.map((fact, index) => {
          const isGraph = fact.source === 'graph';

          return (
            <Card
              key={fact.factId}
              className={cn(
                'transition-all shadow-sm',
                fact.contradictionFlag
                  ? 'border-destructive/50 bg-destructive/5'
                  : 'hover:border-primary/50'
              )}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    {/* Metadata Header */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        #{index + 1}
                      </Badge>

                      {/* Source Badge */}
                      <Badge variant="outline" className="gap-1.5 text-xs">
                        {isGraph ? <Network className="size-3 text-primary" /> : <Database className="size-3 text-primary" />}
                        {fact.source} Retriever
                      </Badge>

                      {fact.isPrimary && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary hover:bg-primary/20">
                          Primary Citation
                        </Badge>
                      )}

                      {/* Contradiction Flag Pill */}
                      {fact.contradictionFlag && (
                        <ContradictionFlag fact={fact} allFacts={facts} />
                      )}
                    </div>

                    {/* Fact text */}
                    <p className="text-sm text-foreground font-medium leading-relaxed">
                      {fact.text}
                    </p>
                  </div>

                  {/* Score breakdown metrics */}
                  <div className="shrink-0 bg-muted/50 border p-4 rounded-md text-left text-sm tabular-nums space-y-2 min-w-[200px]">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Similarity:</span>
                      <span className="text-foreground">{(fact.retrieverScore).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Source Wt:</span>
                      <span className="text-primary font-semibold">{(fact.sourceWeight).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-foreground pt-2 border-t font-bold">
                      <span>Composite:</span>
                      <span className="text-primary">{fact.finalScore.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
