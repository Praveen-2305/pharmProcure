import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubmitProcurementRequest, InvestigationPlan } from '../../api/types';
import { procurementApi } from '../../api/client';
import { Upload, AlertCircle, ArrowRight, Target, Zap, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';

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
    <form onSubmit={handleSubmit} className="space-y-10 text-left">
      {generalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Workflow Submission Error</AlertTitle>
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      {/* Investigation Plan Selector */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">
          Investigation Plan Depth
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            onClick={() => setInvestigationPlan('LIGHT')}
            className={cn(
              'flex items-start gap-4 p-6 cursor-pointer transition-colors duration-150 shadow-sm',
              investigationPlan === 'LIGHT'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <Zap className={cn('size-5 mt-0.5', investigationPlan === 'LIGHT' ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <div className="text-sm font-medium flex items-center gap-2">
                Light Investigation
                <Badge variant="secondary" className="font-normal text-[10px]">
                  Fast
                </Badge>
              </div>
            </div>
          </Card>

          <Card
            onClick={() => setInvestigationPlan('FULL')}
            className={cn(
              'flex items-start gap-4 p-6 cursor-pointer transition-colors duration-150 shadow-sm',
              investigationPlan === 'FULL'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <Target className={cn('size-5 mt-0.5', investigationPlan === 'FULL' ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <div className="text-sm font-medium flex items-center gap-2">
                Full Hybrid Investigation
                <Badge variant="default" className="font-normal text-[10px]">
                  Recommended
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Vendor Name & Deal Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="vendorName" className="text-sm font-semibold">
            Vendor Legal Entity Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="vendorName"
            placeholder="e.g. Apex BioPharma Logistics LLC"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className={errors.vendorName ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {errors.vendorName && <p className="text-xs text-destructive">{errors.vendorName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dealSize" className="text-sm font-semibold">
            Quoted Deal Size ($ USD) <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
            <Input
              id="dealSize"
              type="number"
              min="1"
              step="1"
              placeholder="750000"
              value={dealSize}
              onChange={(e) => setDealSize(e.target.value)}
              className={cn('pl-7', errors.dealSize ? 'border-destructive focus-visible:ring-destructive' : '')}
            />
          </div>
          {errors.dealSize && <p className="text-xs text-destructive">{errors.dealSize}</p>}
        </div>
      </div>

      {/* Contract Upload */}
      <div className="space-y-4">
        <Label className="text-sm font-semibold">
          Contract / RFP Document <span className="text-muted-foreground font-normal normal-case font-sans">(Optional PDF/DOCX)</span>
        </Label>
        <div className="border-2 border-dashed border-muted-foreground/40 hover:border-primary/60 rounded-xl p-10 text-center transition-colors bg-muted/5">
          {contractFile ? (
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg border border-border max-w-sm mx-auto">
              <div className="flex items-center gap-3 text-sm">
                <FileText className="size-4 text-primary" />
                <span className="text-xs truncate max-w-[180px]">{contractFile.name}</span>
                <span className="text-xs text-muted-foreground">{(contractFile.size / 1024).toFixed(0)} KB</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setContractFile(null)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
              >
                Remove
              </Button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
              <Upload className="size-8 text-muted-foreground mb-1" />
              <div className="text-sm">
                <span className="text-primary font-semibold hover:underline">Click to upload document</span> or drag & drop
              </div>
              <p className="text-xs text-muted-foreground">Master Service Agreements, RFP Responses, or Certificates</p>
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
      <div className="space-y-2">
        <Label htmlFor="procurementDetails" className="text-sm font-semibold">
          Scope of Procurement & Details <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="procurementDetails"
          rows={5}
          placeholder="Describe intended services, required regulatory certifications (e.g. FDA 21 CFR Part 820, GAMP 5), deliverables, and timeline milestones..."
          value={procurementDetails}
          onChange={(e) => setProcurementDetails(e.target.value)}
          className={cn('resize-none', errors.procurementDetails ? 'border-destructive focus-visible:ring-destructive' : '')}
        />
        {errors.procurementDetails && (
          <p className="text-xs text-destructive">{errors.procurementDetails}</p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-6 border-t flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Initiates autonomous multi-agent LangGraph workflow
        </p>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="gap-2 px-6"
        >
          {isSubmitting ? (
            <>
              <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Launching Investigation...</span>
            </>
          ) : (
            <>
              <span>Launch Investigation</span>
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
