import React from 'react';
import { SubmitRequestForm } from './SubmitRequestForm';
import { Shield, Sparkles, Network, FileSearch } from 'lucide-react';

export const SubmitRequestPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-teal-600 mb-1">
          <FileSearch className="w-3.5 h-3.5" />
          <span>New Investigation Initiation</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Submit Vendor Procurement Request
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Dispatch an automated risk audit across regulatory registries, knowledge graph nodes, and contract documents using LangGraph multi-agent orchestration.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <SubmitRequestForm />
      </div>

      {/* Architecture Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-lg bg-white border border-slate-200 text-left shadow-sm">
          <div className="text-xs font-mono font-semibold text-teal-600 flex items-center gap-1.5 mb-1.5">
            <Network className="w-3.5 h-3.5" /> 1. Hybrid Retrieval
          </div>
          <p className="text-xs text-slate-500">
            Simultaneously pulls structured knowledge graph facts and unstructured vector embeddings from SEC & FDA repositories.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 text-left shadow-sm">
          <div className="text-xs font-mono font-semibold text-teal-600 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" /> 2. Critic Revision Loop
          </div>
          <p className="text-xs text-slate-500">
            Autonomous Critic agent inspects evidence completeness and re-triggers execution if contradictions or evidence gaps are detected.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 text-left shadow-sm">
          <div className="text-xs font-mono font-semibold text-teal-600 flex items-center gap-1.5 mb-1.5">
            <Shield className="w-3.5 h-3.5" /> 3. 4D Risk Scoring
          </div>
          <p className="text-xs text-slate-500">
            Evaluates Financial, Compliance, Contractual, and Pricing Ceiling risks independently with auditable rationale.
          </p>
        </div>
      </div>
    </div>
  );
};
