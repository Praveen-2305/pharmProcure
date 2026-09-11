import React from 'react';
import { SubmitRequestForm } from './SubmitRequestForm';
import { Shield, Sparkles, Network, FileSearch } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const SubmitRequestPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
      {/* Page Header */}
      <div className="border-b pb-5">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Submit Vendor Procurement Request
        </h1>
      </div>

      {/* Main Form Container */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          <SubmitRequestForm />
        </CardContent>
      </Card>
    </div>
  );
};
