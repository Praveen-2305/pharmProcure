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
  Filter,
  ArrowUpRight,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Layers,
  FilePlus2,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const DashboardPage: React.FC = () => {
  const [items, setItems] = useState<ProcurementItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');

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
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-teal-400 mb-1">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Audit Trail & Governance Log</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Procurement Cases & Intelligence Log
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Auditable archive of all multi-agent risk assessments, fusion citations, and executive determinations (POC §4 Step 10).
          </p>
        </div>

        <Link
          to="/submit"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs font-semibold shadow-md transition"
        >
          <FilePlus2 className="w-4 h-4" />
          <span>New Investigation</span>
        </Link>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Total Case Audits</span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">{items.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-teal-400 uppercase block">Completed Reviews</span>
          <span className="text-xl font-bold text-teal-300 font-mono mt-1 block">
            {items.filter((i) => i.status.stage === 'COMPLETE').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-amber-400 uppercase block">Awaiting Sign-off</span>
          <span className="text-xl font-bold text-amber-300 font-mono mt-1 block">
            {items.filter((i) => i.status.stage === 'AWAITING_APPROVAL').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] font-mono text-rose-400 uppercase block">Terminated / Failed</span>
          <span className="text-xl font-bold text-rose-300 font-mono mt-1 block">
            {items.filter((i) => i.status.stage === 'FAILED').length}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by vendor name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono shrink-0">
            <SlidersHorizontal className="w-3 h-3" /> Filter:
          </span>
          {['ALL', 'COMPLETE', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'FAILED'].map((stg) => (
            <button
              key={stg}
              onClick={() => setStageFilter(stg)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-mono transition uppercase whitespace-nowrap',
                stageFilter === stg
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/50 border border-slate-700/50'
              )}
            >
              {stg.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Vendor & Case ID</th>
                <th className="px-4 py-3.5">Deal Size</th>
                <th className="px-4 py-3.5">Workflow Stage</th>
                <th className="px-4 py-3.5">Risk Severity</th>
                <th className="px-4 py-3.5">Evidence Quality</th>
                <th className="px-4 py-3.5">Created</th>
                <th className="px-4 py-3.5 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 font-mono">
                    Loading case ledger...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    No cases match the selected filter query.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const risk = item.report?.riskAssessment.overallRisk;
                  const confidence = item.report?.riskAssessment.confidenceScore;

                  return (
                    <tr key={item.procurementId} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white text-sm">{item.vendorName}</div>
                        <div className="font-mono text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{item.procurementId}</span>
                          <span className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                            {item.status.investigationPlan}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-mono font-medium text-slate-200">
                        {formatCurrency(item.dealSize)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border',
                            item.status.stage === 'COMPLETE'
                              ? 'bg-teal-950/60 border-teal-500/40 text-teal-300'
                              : item.status.stage === 'AWAITING_APPROVAL'
                              ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                              : item.status.stage === 'FAILED'
                              ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                              : 'bg-slate-800 border-slate-700 text-slate-300 animate-pulse'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              item.status.stage === 'COMPLETE'
                                ? 'bg-teal-400'
                                : item.status.stage === 'AWAITING_APPROVAL'
                                ? 'bg-amber-400'
                                : item.status.stage === 'FAILED'
                                ? 'bg-rose-400'
                                : 'bg-indigo-400'
                            )}
                          />
                          {item.status.stage}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {risk ? (
                          <RiskLevelTag level={risk} size="sm" />
                        ) : item.status.stage === 'FAILED' ? (
                          <span className="text-slate-400 font-mono text-[11px]">N/A (Terminated)</span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">In Analysis</span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {confidence !== undefined ? (
                          <ConfidenceBadge score={confidence} size="sm" />
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Pending</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          to={`/review/${item.procurementId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
