import React, { useState, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Progress } from '../../components/ui/progress';
import { cn } from '../../lib/utils';
import { BatchLineItem, BatchAuditSummary, DpcoStatus } from './types';
import { SAMPLE_TENDER_ITEMS, REFERENCE_DPCO_CEILINGS } from './sampleData';

function formatINR(val: number): string {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} Lakh`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

export const BatchAuditPage: React.FC = () => {
  const [items, setItems] = useState<BatchLineItem[]>(SAMPLE_TENDER_ITEMS);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'EXCEEDS_CEILING' | 'WITHIN_CEILING'>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalculate summary metrics whenever items change
  const summary: BatchAuditSummary = useMemo(() => {
    let totalQuoted = 0;
    let totalExcess = 0;
    let violations = 0;
    let compliant = 0;

    items.forEach((item) => {
      totalQuoted += item.totalQuoted;
      totalExcess += item.totalExcess;
      if (item.dpcoStatus === 'EXCEEDS_CEILING') {
        violations += 1;
      } else {
        compliant += 1;
      }
    });

    const compliantSpend = totalQuoted - totalExcess;
    const rate = items.length > 0 ? (compliant / items.length) * 100 : 100;

    return {
      totalItems: items.length,
      totalQuotedAmount: totalQuoted,
      totalCompliantAmount: compliantSpend,
      totalOverchargeAmount: totalExcess,
      violatingItemsCount: violations,
      compliantItemsCount: compliant,
      complianceRate: Math.round(rate),
    };
  }, [items]);

  // Handle single item price adjustment (e.g. negotiation or capping)
  const handleUpdatePrice = (id: string, newUnitPrice: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const quoted = Math.max(0, newUnitPrice);
        const ceiling = item.ceilingUnitPrice;
        let dpcoStatus: DpcoStatus = 'NON_SCHEDULED';
        let excessPerUnit = 0;
        let totalExcess = 0;

        if (ceiling !== null) {
          if (quoted > ceiling) {
            dpcoStatus = 'EXCEEDS_CEILING';
            excessPerUnit = quoted - ceiling;
            totalExcess = excessPerUnit * item.quantity;
          } else {
            dpcoStatus = 'WITHIN_CEILING';
            excessPerUnit = 0;
            totalExcess = 0;
          }
        }

        return {
          ...item,
          quotedUnitPrice: quoted,
          totalQuoted: quoted * item.quantity,
          dpcoStatus,
          excessPerUnit,
          totalExcess,
        };
      })
    );
  };

  // One-click capping to exact DPCO ceiling
  const handleCapToCeiling = (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target && target.ceilingUnitPrice !== null) {
      handleUpdatePrice(id, target.ceilingUnitPrice);
    }
  };

  // Cap all violating items in bulk
  const handleCapAllViolations = () => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.dpcoStatus === 'EXCEEDS_CEILING' && item.ceilingUnitPrice !== null) {
          return {
            ...item,
            quotedUnitPrice: item.ceilingUnitPrice,
            totalQuoted: item.ceilingUnitPrice * item.quantity,
            dpcoStatus: 'WITHIN_CEILING',
            excessPerUnit: 0,
            totalExcess: 0,
          };
        }
        return item;
      })
    );
  };

  // Load sample dataset
  const handleLoadSample = () => {
    setItems(SAMPLE_TENDER_ITEMS);
    setSearch('');
    setFilterTab('ALL');
  };

  // Handle CSV file upload & parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const parsed: BatchLineItem[] = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          const name = parts[0] || `Item-${i}`;
          const qty = parseFloat(parts[1]) || 100;
          const quoted = parseFloat(parts[2]) || 500;
          const unit = parts[3] || 'Units';

          // Match reference ceiling
          const lower = name.toLowerCase();
          let ceiling: number | null = null;
          let ref = 'Non-Scheduled Market Pricing';

          for (const [key, val] of Object.entries(REFERENCE_DPCO_CEILINGS)) {
            if (lower.includes(key)) {
              ceiling = val.ceiling;
              ref = val.reference;
              break;
            }
          }

          let dpcoStatus: DpcoStatus = 'NON_SCHEDULED';
          let excess = 0;
          if (ceiling !== null) {
            if (quoted > ceiling) {
              dpcoStatus = 'EXCEEDS_CEILING';
              excess = quoted - ceiling;
            } else {
              dpcoStatus = 'WITHIN_CEILING';
            }
          }

          parsed.push({
            id: `CSV-${i.toString().padStart(3, '0')}`,
            name,
            genericName: name.split(' ')[0],
            dosageForm: 'Pharmaceutical formulation',
            category: 'Hospital Procurement Batch',
            quantity: qty,
            unit,
            quotedUnitPrice: quoted,
            ceilingUnitPrice: ceiling,
            dpcoStatus,
            excessPerUnit: excess,
            totalExcess: excess * qty,
            totalQuoted: quoted * qty,
            statutoryReference: ref,
          });
        }
      }

      if (parsed.length > 0) {
        setItems(parsed);
      }
    };
    reader.readAsText(file);
  };

  // Export audited tender as CSV
  const handleExportCsv = () => {
    const headers = [
      'Line ID',
      'Item Description',
      'Quantity',
      'Unit',
      'Quoted Unit Price (INR)',
      'DPCO Ceiling (INR)',
      'Compliance Status',
      'Overcharge Per Unit (INR)',
      'Total Overcharge (INR)',
      'Total Quoted (INR)',
      'Statutory Legal Reference',
    ];

    const rows = items.map((i) => [
      i.id,
      `"${i.name}"`,
      i.quantity,
      i.unit,
      i.quotedUnitPrice,
      i.ceilingUnitPrice ?? 'N/A',
      i.dpcoStatus,
      i.excessPerUnit,
      i.totalExcess,
      i.totalQuoted,
      `"${i.statutoryReference}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AutonoSource_Audited_Tender_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.genericName.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterTab === 'ALL' || item.dpcoStatus === filterTab;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-md bg-primary/20 text-primary">
              <FileSpreadsheet className="size-4" />
            </span>
            <Badge variant="outline" className="font-mono text-xs">Bulk Tender Audit Engine</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Bulk Procurement & RFP Line-Item Auditor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload hospital tender CSVs or inspect procurement schedules. Automatically verifies each molecule against NPPA DPCO statutory ceiling orders in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 text-xs"
          >
            <UploadCloud className="size-3.5" />
            <span>Upload Tender CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadSample}
            className="gap-2 text-xs border-primary/40 text-primary hover:bg-primary/20"
          >
            <Sparkles className="size-3.5" />
            <span>Load AIIMS Specimen</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleExportCsv}
            className="gap-2 text-xs shadow-xs"
          >
            <Download className="size-3.5" />
            <span>Export Audited CSV</span>
          </Button>
        </div>
      </div>

      {/* High-Level Spend & Compliance KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Total Tender Quoted</CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {formatINR(summary.totalQuotedAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            {summary.totalItems} pharmaceutical line items
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Statutory Overcharges</CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-400">
              {formatINR(summary.totalOverchargeAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-rose-400/80 font-medium">
            {summary.violatingItemsCount} items exceed DPCO ceilings
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Compliant Budget</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">
              {formatINR(summary.totalCompliantAmount)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-[11px] text-muted-foreground">
            Within statutory price caps
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-sm border-border/60">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs uppercase font-medium">Compliance Rate</CardDescription>
              <span className="text-xs font-mono font-bold text-primary">{summary.complianceRate}%</span>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {summary.compliantItemsCount} / {summary.totalItems} Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Progress value={summary.complianceRate} className="h-1.5 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Bulk Action Banner if violations exist */}
      {summary.violatingItemsCount > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <ShieldAlert className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {summary.violatingItemsCount} line items violate statutory DPCO 2013 price ceilings!
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Potential institutional recovery: <strong className="text-rose-400">{formatINR(summary.totalOverchargeAmount)}</strong>. Capping prices guarantees statutory immunity under NPPA order rules.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleCapAllViolations}
            className="text-xs gap-1.5 shrink-0"
          >
            <TrendingDown className="size-3.5" />
            <span>Cap All to Ceilings</span>
          </Button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Search line items or molecules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs bg-background/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="size-4 text-muted-foreground hidden sm:block" />
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              size="sm"
              variant={filterTab === 'ALL' ? 'default' : 'outline'}
              onClick={() => setFilterTab('ALL')}
              className="text-xs h-8 px-3"
            >
              All Items ({items.length})
            </Button>
            <Button
              size="sm"
              variant={filterTab === 'EXCEEDS_CEILING' ? 'destructive' : 'outline'}
              onClick={() => setFilterTab('EXCEEDS_CEILING')}
              className="text-xs h-8 px-3"
            >
              Violations ({summary.violatingItemsCount})
            </Button>
            <Button
              size="sm"
              variant={filterTab === 'WITHIN_CEILING' ? 'default' : 'outline'}
              onClick={() => setFilterTab('WITHIN_CEILING')}
              className="text-xs h-8 px-3"
            >
              Compliant ({summary.compliantItemsCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Main Line-Items Table */}
      <Card className="bg-card/70 backdrop-blur-sm border-border/70 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border/60 text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Line Item & Category</th>
                <th className="py-3 px-3">Volume</th>
                <th className="py-3 px-3">Quoted Unit Price</th>
                <th className="py-3 px-3">DPCO Ceiling</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Total Overcharge</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredItems.map((item) => {
                const isViolating = item.dpcoStatus === 'EXCEEDS_CEILING';
                const isEditing = editingId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={cn(
                      "hover:bg-accent/40 transition-colors",
                      isViolating && "bg-rose-500/5 hover:bg-rose-500/10"
                    )}
                  >
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground font-semibold">{item.id}</span>
                          <span className="font-medium text-foreground text-xs">{item.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {item.category} • <span className="font-mono">{item.dosageForm}</span>
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono font-medium text-foreground">
                        {item.quantity.toLocaleString('en-IN')}
                      </span>{' '}
                      <span className="text-[10px] text-muted-foreground">{item.unit}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            defaultValue={item.quotedUnitPrice}
                            onBlur={(e) => {
                              handleUpdatePrice(item.id, parseFloat(e.target.value) || 0);
                              setEditingId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdatePrice(item.id, parseFloat((e.target as HTMLInputElement).value) || 0);
                                setEditingId(null);
                              }
                            }}
                            autoFocus
                            className="h-7 w-24 text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingId(item.id)}
                          className="font-mono font-bold text-foreground hover:underline flex items-center gap-1 text-xs"
                          title="Click to manually edit quoted price"
                        >
                          ₹{item.quotedUnitPrice.toLocaleString('en-IN')}
                        </button>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Total: {formatINR(item.totalQuoted)}
                      </p>
                    </td>

                    <td className="py-3.5 px-3">
                      {item.ceilingUnitPrice !== null ? (
                        <div>
                          <span className="font-mono font-semibold text-foreground">
                            ₹{item.ceilingUnitPrice.toLocaleString('en-IN')}
                          </span>
                          <p className="text-[9px] text-muted-foreground font-mono truncate max-w-[150px]" title={item.statutoryReference}>
                            {item.statutoryReference}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">Free Market</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {isViolating ? (
                        <Badge variant="destructive" className="text-[10px] gap-1 font-mono">
                          <AlertTriangle className="size-3" />
                          +₹{item.excessPerUnit.toLocaleString('en-IN')}/unit
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px] gap-1 font-mono bg-emerald-600/20 text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="size-3" />
                          Compliant
                        </Badge>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono font-semibold">
                      {item.totalExcess > 0 ? (
                        <span className="text-rose-400">+{formatINR(item.totalExcess)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      {isViolating && item.ceilingUnitPrice !== null && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCapToCeiling(item.id)}
                          className="text-[11px] h-7 px-2.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                          title="Cap this item price to the statutory DPCO ceiling"
                        >
                          Cap to Ceiling
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
