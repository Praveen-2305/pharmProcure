import React from 'react';
import { ExposedVendorSummary } from '../../api/types';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface VendorExposureTableProps {
  vendors: ExposedVendorSummary[];
}

export const VendorExposureTable: React.FC<VendorExposureTableProps> = ({ vendors }) => {
  return (
    <Card className="border border-border/80 shadow-md bg-card/60 backdrop-blur-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-500" />
              Highest-Exposure Suppliers Audited
            </CardTitle>
            <CardDescription className="text-xs">
              Suppliers ranked by cumulative DPCO pricing markups and contractual risk exposure
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Top {vendors.length} Vendors
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Supplier Legal Entity</th>
                <th className="py-3 px-3">Risk Level</th>
                <th className="py-3 px-3">Deals Audited</th>
                <th className="py-3 px-3">Procurement Volume</th>
                <th className="py-3 px-3">Overpayment Caught</th>
                <th className="py-3 px-3">Primary Finding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-medium">
              {vendors.map((vendor, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-semibold text-foreground flex items-center gap-2">
                    <span className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{vendor.vendorName}</span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        vendor.riskLevel === 'HIGH'
                          ? 'border-rose-500/40 text-rose-400 bg-rose-950/20'
                          : vendor.riskLevel === 'MEDIUM'
                          ? 'border-amber-500/40 text-amber-400 bg-amber-950/20'
                          : 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                      }`}
                    >
                      {vendor.riskLevel}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground font-mono">
                    {vendor.casesCount} {vendor.casesCount === 1 ? 'deal' : 'deals'}
                  </td>
                  <td className="py-3 px-3 text-foreground font-mono">
                    {formatCurrency(vendor.totalDealSizeInr)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold">
                    {vendor.overpaymentCaughtInr > 0 ? (
                      <span className="text-rose-400">
                        {formatCurrency(vendor.overpaymentCaughtInr)}
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        ₹0 (Clean)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-xs truncate" title={vendor.primaryViolation}>
                    {vendor.primaryViolation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
