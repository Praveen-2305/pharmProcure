import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProcurementItemSummary } from '../../api/types';
import { procurementApi } from '../../api/client';
import { RiskLevelTag } from '../../components/RiskLevelTag';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  LayoutDashboard,
  Search,
  ArrowRight,
  FilePlus2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const DashboardPage: React.FC = () => {
  const [items, setItems] = useState<ProcurementItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  useEffect(() => {
    document.title = "Executive Dashboard | AutonoSource";
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await procurementApi.getAllProcurements();
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.procurementId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage =
      stageFilter === 'ALL' ||
      (stageFilter === 'COMPLETE' && item.status.stage === 'COMPLETE') ||
      (stageFilter === 'AWAITING_APPROVAL' && item.status.stage === 'AWAITING_APPROVAL') ||
      (stageFilter === 'FAILED' && item.status.stage === 'FAILED') ||
      (stageFilter === 'IN_PROGRESS' && item.status.stage !== 'COMPLETE' && item.status.stage !== 'FAILED' && item.status.stage !== 'AWAITING_APPROVAL');
    return matchesSearch && matchesStage;
  });

  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-8 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
            <LayoutDashboard className="size-4" />
            <span>Audit Trail & Governance Log</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Procurement Cases
          </h1>
        </div>

        <Link to="/submit" className={cn(buttonVariants({ variant: 'default' }), "gap-2")}>
          <FilePlus2 className="size-4" />
          <span>New Investigation</span>
        </Link>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Case Audits</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-2xl font-bold text-foreground block">{items.length}</span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Completed Reviews</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-2xl font-bold text-foreground block">
              {items.filter((i) => i.status.stage === 'COMPLETE').length}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Awaiting Sign-off</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-2xl font-bold text-foreground block">
              {items.filter((i) => i.status.stage === 'AWAITING_APPROVAL').length}
            </span>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Terminated / Failed</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <span className="text-2xl font-bold text-destructive block">
              {items.filter((i) => i.status.stage === 'FAILED').length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-muted-foreground absolute left-3 top-2.5" />
          <Input
            placeholder="Search by vendor name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5 shrink-0">
            <SlidersHorizontal className="size-4" /> Filter:
          </span>
          {['ALL', 'COMPLETE', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'FAILED'].map((stg) => (
            <Button
              key={stg}
              variant={stageFilter === stg ? "default" : "secondary"}
              size="sm"
              onClick={() => setStageFilter(stg)}
              className="text-xs capitalize"
            >
              {stg === 'ALL' ? 'All' : stg.replace('_', ' ').toLowerCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <Card className="border-border shadow-sm flex flex-col bg-card">
        <div className="overflow-y-auto max-h-[600px] w-full rounded-xl">
          <Table className="min-w-[1000px] [&_th]:px-6 [&_th]:py-4 [&_td]:px-6 [&_td]:py-5">
            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-md shadow-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold text-sm text-muted-foreground h-12">Vendor</TableHead>
                <TableHead className="font-semibold text-sm text-muted-foreground h-12">Deal Size</TableHead>
                <TableHead className="font-semibold text-sm text-muted-foreground h-12">Status</TableHead>
                <TableHead className="font-semibold text-sm text-muted-foreground h-12">Risk</TableHead>
                <TableHead className="font-semibold text-sm text-muted-foreground h-12">Evidence</TableHead>
                <TableHead className="font-semibold text-sm text-muted-foreground h-12">Date</TableHead>
                <TableHead className="text-right font-semibold text-sm text-muted-foreground h-12">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading cases...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No cases match the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const risk = item.report?.riskAssessment.overallRisk;
                  const confidence = item.report?.riskAssessment.confidenceScore;

                  return (
                    <TableRow key={item.procurementId} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="font-semibold text-foreground text-sm">{item.vendorName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1.5">
                          <div className={cn(
                            "size-1.5 rounded-full",
                            item.status.investigationPlan === 'FULL' ? "bg-orange-500" : "bg-orange-300/60 dark:bg-orange-800/50"
                          )} />
                          <span className={cn(
                            "text-xs",
                            item.status.investigationPlan === 'FULL' ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                          )}>
                            {item.status.investigationPlan}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="font-medium text-foreground text-sm">
                        {formatCurrency(item.dealSize)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            item.status.stage === 'COMPLETE' ? 'default'
                            : item.status.stage === 'AWAITING_APPROVAL' ? 'secondary'
                            : item.status.stage === 'FAILED' ? 'destructive'
                            : 'outline'
                          }
                          className="font-medium text-[11px] uppercase tracking-wider px-2.5 py-0.5"
                        >
                          {item.status.stage.replace('_', ' ')}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        {risk ? (
                          <RiskLevelTag level={risk} size="sm" />
                        ) : item.status.stage === 'FAILED' ? (
                          <span className="text-muted-foreground text-xs italic">Terminated</span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Analyzing...</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {confidence !== undefined ? (
                          <ConfidenceBadge score={confidence} size="sm" />
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Pending</span>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(item.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <Link to={`/review/${item.procurementId}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 gap-1.5 font-medium hover:bg-primary/5 hover:text-primary transition-colors")}>
                          Review <ArrowRight className="size-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
