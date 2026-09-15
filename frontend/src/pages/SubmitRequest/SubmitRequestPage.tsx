import React from 'react';
import { SubmitRequestForm } from './SubmitRequestForm';
import { Shield, Sparkles } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const SubmitRequestPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>Autonomous Due Diligence Intake</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Submit Vendor Procurement Request
          </h1>
          <p className="text-sm text-muted-foreground">
            Initiate multi-agent risk scoring, statutory price ceiling audit, and regulatory due diligence.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 self-start sm:self-auto text-xs bg-muted/40 font-mono">
          <Shield className="size-3.5 text-primary" />
          <span>CDSCO & DPCO 2013 Verified</span>
        </Badge>
      </div>

      {/* Main Form Container */}
      <Card className="shadow-xs border-border/80">
        <CardContent className="p-6 sm:p-8">
          <SubmitRequestForm />
        </CardContent>
      </Card>
    </div>
  );
};

