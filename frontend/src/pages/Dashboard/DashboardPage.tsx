import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProcurementItemSummary } from '../../api/types';
import { procurementApi, normalizeError } from '../../api/client';
import { RiskLevelTag } from '../../components/RiskLevelTag';
import { ConfidenceBadge } from '../../components/ConfidenceBadge';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  LayoutDashboard,
  Search,
  ArrowRight,
  FilePlus2,
  SlidersHorizontal,
  AlertCircle,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export const DashboardPage: React.FC = () => {
  const [items, setItems] = useState<ProcurementItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState<ProcurementItemSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteFromCatalog, setDeleteFromCatalog] = useState(false);

  useEffect(() => {
    document.title = "Executive Dashboard | AutonoSource";
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const data = await procurementApi.getAllProcurements();
      setItems(data);
    } catch (err: unknown) {
      const apiErr = normalizeError(err);
      setError(apiErr.message || 'Failed to load procurement cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteFeedback(null);
    try {
      if (deleteFromCatalog && procurementApi.deleteVendor) {
        await procurementApi.deleteVendor(deleteTarget.vendorName);
      }
      await procurementApi.deleteProcurement(deleteTarget.procurementId);

      setItems((prev) => prev.filter((i) => i.procurementId !== deleteTarget.procurementId));
      setDeleteSuccess(`Vendor "${deleteTarget.vendorName}" (${deleteTarget.procurementId}) was successfully deleted.`);

      // Notify Sidebar and other components
      window.dispatchEvent(new CustomEvent('pharmprocure_reviews_updated'));

      setDeleteTarget(null);
    } catch (err: unknown) {
      const apiErr = normalizeError(err);
      setDeleteFeedback(apiErr.message || 'Failed to delete vendor. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dashboard Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="xs" onClick={loadData} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {deleteSuccess && (
        <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="font-semibold text-emerald-900 dark:text-emerald-100">Vendor Record Removed</AlertTitle>
          <AlertDescription className="flex items-center justify-between text-xs mt-1">
            <span>{deleteSuccess}</span>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setDeleteSuccess(null)}
              className="h-6 px-2 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/review/${item.procurementId}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 gap-1.5 font-medium hover:bg-primary/5 hover:text-primary transition-colors")}>
                            Review <ArrowRight className="size-3.5" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeleteTarget(item);
                              setDeleteFeedback(null);
                              setDeleteFromCatalog(false);
                            }}
                            className="h-8 px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-1.5"
                            title={`Delete ${item.vendorName}`}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="hidden sm:inline text-xs">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete Vendor Confirmation Modal */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md p-6 space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-destructive">
              <div className="p-2 rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="size-5" />
              </div>
              Delete Vendor Record
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground font-semibold">{deleteTarget?.vendorName}</strong>?
              This will permanently remove procurement case <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">{deleteTarget?.procurementId}</code>.
            </DialogDescription>
          </DialogHeader>

          {deleteFeedback && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{deleteFeedback}</AlertDescription>
            </Alert>
          )}

          {deleteTarget && (
            <div className="rounded-lg border bg-muted/40 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Vendor Entity:</span>
                <span className="font-semibold text-foreground">{deleteTarget.vendorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Case ID:</span>
                <span className="font-mono text-foreground">{deleteTarget.procurementId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Quoted Deal Size:</span>
                <span className="font-semibold text-foreground">{formatCurrency(deleteTarget.dealSize)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status Stage:</span>
                <span className="font-medium text-foreground uppercase">{deleteTarget.status.stage.replace('_', ' ')}</span>
              </div>
            </div>
          )}

          {/* Option to also delete vendor master catalog entry */}
          <div className="flex items-start space-x-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3.5">
            <input
              type="checkbox"
              id="deleteFromCatalogCheckbox"
              checked={deleteFromCatalog}
              onChange={(e) => setDeleteFromCatalog(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border text-destructive focus:ring-destructive accent-destructive cursor-pointer"
            />
            <label
              htmlFor="deleteFromCatalogCheckbox"
              className="text-xs font-medium leading-snug cursor-pointer select-none text-foreground"
            >
              <span>Also purge vendor from master directory catalog</span>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-normal">
                Permanently purges associated vendor metadata, master compliance history, and catalog links.
              </p>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="gap-1.5"
            >
              {isDeleting ? (
                <>
                  <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  Confirm Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
