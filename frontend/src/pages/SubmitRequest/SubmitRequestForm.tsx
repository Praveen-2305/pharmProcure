import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmitProcurementRequest, InvestigationPlan } from '../../api/types';
import { procurementApi } from '../../api/client';
import { Upload, AlertCircle, ArrowRight, ShieldCheck, Zap, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

export const SubmitRequestForm: React.FC = () => {
  const navigate = useNavigate();

  const [vendorName, setVendorName] = useState('');
  const [dealSize, setDealSize] = useState<string>('');
  const [procurementDetails, setProcurementDetails] = useState('');
  const [investigationPlan, setInvestigationPlan] = useState<InvestigationPlan>('FULL');
  const [contractFile, setContractFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!vendorName.trim()) {
      errs.vendorName = 'Vendor name is required.';
    } else if (vendorName.trim().length < 3) {
      errs.vendorName = 'Vendor name must be at least 3 characters.';
    }

    const parsedDeal = parseFloat(dealSize);
    if (!dealSize || isNaN(parsedDeal) || parsedDeal <= 0) {
      errs.dealSize = 'Please enter a valid positive deal size.';
    }

    if (!procurementDetails.trim()) {
      errs.procurementDetails = 'Procurement details and scope of work are required.';
    } else if (procurementDetails.trim().length < 15) {
      errs.procurementDetails = 'Please provide sufficient context (minimum 15 characters).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const request: SubmitProcurementRequest = {
        vendorName: vendorName.trim(),
        dealSize: parseFloat(dealSize),
        procurementDetails: procurementDetails.trim(),
        investigationPlan,
        contractDocument: contractFile || undefined,
      };

      const result = await procurementApi.submitRequest(request);
      navigate(`/review/${result.procurementId}`);
    } catch (err: any) {
      setGeneralError(err.message || 'Submission failed. Please check inputs and retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {generalError && (
        <div className="p-4 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Workflow Submission Error</p>
            <p className="text-xs text-rose-200 mt-0.5">{generalError}</p>
          </div>
        </div>
      )}

      {/* Investigation Plan Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
          Investigation Plan Depth
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setInvestigationPlan('LIGHT')}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all',
              investigationPlan === 'LIGHT'
                ? 'bg-teal-500/10 border-teal-500/50 text-white ring-1 ring-teal-500/30'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            )}
          >
            <Zap className={cn('w-5 h-5 mt-0.5', investigationPlan === 'LIGHT' ? 'text-teal-400' : 'text-slate-400')} />
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                Light Investigation
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  Fast
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Single-iteration entity resolution & vector scan. Best for low-tier commoditized supply.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setInvestigationPlan('FULL')}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all',
              investigationPlan === 'FULL'
                ? 'bg-teal-500/10 border-teal-500/50 text-white ring-1 ring-teal-500/30'
                : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
            )}
          >
            <ShieldCheck className={cn('w-5 h-5 mt-0.5', investigationPlan === 'FULL' ? 'text-teal-400' : 'text-slate-400')} />
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                Full Hybrid Investigation
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 border border-teal-800 text-teal-300">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Multi-agent LangGraph workflow with Graph+Vector fusion, Critic revision loop & pricing benchmarks.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Vendor Name & Deal Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label htmlFor="vendorName" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Vendor Legal Entity Name <span className="text-rose-400">*</span>
          </label>
          <input
            id="vendorName"
            type="text"
            placeholder="e.g. Apex BioPharma Logistics LLC"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition',
              errors.vendorName
                ? 'border-rose-500 focus:ring-rose-500/30'
                : 'border-slate-700 focus:border-teal-500 focus:ring-teal-500/20'
            )}
          />
          {errors.vendorName && <p className="text-xs text-rose-400">{errors.vendorName}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="dealSize" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Quoted Deal Size ($ USD) <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-mono">$</span>
            <input
              id="dealSize"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 750000"
              value={dealSize}
              onChange={(e) => setDealSize(e.target.value)}
              className={cn(
                'w-full pl-8 pr-3.5 py-2.5 rounded-lg bg-slate-800/80 border text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 transition',
                errors.dealSize
                  ? 'border-rose-500 focus:ring-rose-500/30'
                  : 'border-slate-700 focus:border-teal-500 focus:ring-teal-500/20'
              )}
            />
          </div>
          {errors.dealSize && <p className="text-xs text-rose-400">{errors.dealSize}</p>}
        </div>
      </div>

      {/* Contract Upload */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          Contract / RFP Document <span className="text-slate-400 font-normal font-sans">(Optional PDF/DOCX)</span>
        </label>
        <div className="border-2 border-dashed border-slate-700 hover:border-slate-600 rounded-lg p-4 text-center bg-slate-800/30 transition">
          {contractFile ? (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 rounded-md border border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <FileText className="w-4 h-4 text-teal-400" />
                <span className="font-mono text-xs truncate max-w-[250px]">{contractFile.name}</span>
                <span className="text-xs text-slate-400">({(contractFile.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button
                type="button"
                onClick={() => setContractFile(null)}
                className="text-xs text-rose-400 hover:text-rose-300 underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5">
              <Upload className="w-6 h-6 text-slate-400" />
              <div className="text-xs text-slate-300">
                <span className="text-teal-400 font-semibold hover:underline">Click to upload document</span> or drag & drop
              </div>
              <p className="text-[11px] text-slate-400">Master Service Agreements, RFP Responses, or Certificates</p>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setContractFile(e.target.files[0]);
                }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Procurement Details */}
      <div className="space-y-1.5">
        <label htmlFor="procurementDetails" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          Scope of Procurement & Details <span className="text-rose-400">*</span>
        </label>
        <textarea
          id="procurementDetails"
          rows={4}
          placeholder="Describe intended services, required regulatory certifications (e.g. FDA 21 CFR Part 820, GAMP 5), deliverables, and timeline milestones..."
          value={procurementDetails}
          onChange={(e) => setProcurementDetails(e.target.value)}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition leading-relaxed',
            errors.procurementDetails
              ? 'border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-700 focus:border-teal-500 focus:ring-teal-500/20'
          )}
        />
        {errors.procurementDetails && (
          <p className="text-xs text-rose-400">{errors.procurementDetails}</p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <p className="text-xs text-slate-400 font-mono">
          Initiates autonomous multi-agent LangGraph workflow
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-slate-950 transition-all shadow-md',
            isSubmitting
              ? 'bg-teal-700 cursor-not-allowed opacity-70'
              : 'bg-teal-400 hover:bg-teal-300 shadow-teal-950/40 hover:shadow-teal-900/60'
          )}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Launching Investigation...</span>
            </>
          ) : (
            <>
              <span>Launch Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
