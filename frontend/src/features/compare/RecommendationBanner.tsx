import React from 'react';
import { ComparisonRecommendation } from '../../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Trophy, CheckCircle2, AlertOctagon, HelpCircle, ArrowRight } from 'lucide-react';

interface RecommendationBannerProps {
  recommendation: ComparisonRecommendation;
}

export const RecommendationBanner: React.FC<RecommendationBannerProps> = ({
  recommendation,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Winner Card */}
      <Card className="border-2 border-emerald-500/50 bg-emerald-950/20 shadow-lg">
        <CardHeader className="p-5 pb-3 border-b border-emerald-500/30 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Trophy className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider">
                  Recommended Supplier
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Automated Decision Rationale</span>
              </div>
              <CardTitle className="text-xl font-bold text-foreground mt-0.5">
                {recommendation.recommendedVendor}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-3">
          <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
            {recommendation.selectionRationale}
          </p>
        </CardContent>
      </Card>

      {/* Why Not The Others Card */}
      {recommendation.whyNotOthers && recommendation.whyNotOthers.length > 0 && (
        <Card className="border border-border/80 bg-card/60 shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <AlertOctagon className="size-4 text-amber-400" />
              <span>Transparent Disqualification Breakdown ("Why Not The Others")</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="space-y-2">
              {recommendation.whyNotOthers.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span className="size-2 rounded-full bg-rose-400 shrink-0" />
                    <span>{item.vendorName}</span>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-right font-medium max-w-xl">
                    {item.disqualificationReason}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
