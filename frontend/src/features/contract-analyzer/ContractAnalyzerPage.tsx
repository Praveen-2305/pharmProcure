import React, { useState, useEffect } from 'react';
import {
  ContractAuditResponse,
  NegotiationPackResponse,
} from '../../api/types';
import {
  auditContract,
  generateNegotiationPack,
} from '../../api/contractAnalyzer';
import { ClauseAuditCard } from './ClauseAuditCard';
import { NegotiationPackModal } from './NegotiationPackModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  FileText,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Upload,
  RefreshCw,
  Send,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const SAMPLE_HIGH_RISK_CONTRACT = `MASTER PHARMACEUTICAL SUPPLY AGREEMENT (DRAFT)

Clause 2.2 Storage & Distribution:
Goods and biologics shall be maintained at Controlled Room Temperature 15°C–25°C in transit without requirement for mandatory continuous digital IoT temperature loggers.

Clause 4.1 Limitation of Liability:
Supplier aggregate liability under this agreement for defective, contaminated, or sub-potent batches shall be strictly capped at ₹50,000 for any and all defaults.

Clause 7.3 Default & Cure Period:
In the event of a breach, buyer must provide a 7-day cure period prior to seeking external alternative procurement.

Clause 11.2 Dispute Resolution & Jurisdiction:
This agreement shall be governed exclusively by the laws of England with arbitration seated in the London Court of International Arbitration.

Clause 14.1 Pricing & Escalation:
Quoted prices are subject to quarterly escalation and exclude DPCO 2013 statutory limits.`;

const SAMPLE_COMPLIANT_CONTRACT = `SCHEDULE M COMPLIANT SUPPLY AGREEMENT

Clause 2.1 Cold-Chain Logistics:
Supplier warrants that products are maintained strictly at 2°C–8°C using WHO TRS 1025 validated insulated packaging with continuous digital NIST data loggers throughout transit.

Clause 4.1 Indemnification:
Supplier indemnifies buyer with a liability cap of 150% of the total purchase order value, uncapped in the event of gross negligence or regulatory recalls.

Clause 7.1 Remedy Period:
A standard 30-day written notice and cure period applies to batch discrepancies and audit findings.

Clause 11.1 Dispute Jurisdiction:
Arbitration shall be governed by the Arbitration and Conciliation Act, 1996 seated in New Delhi, India.

Clause 14.1 DPCO Compliance:
Supplier warrants compliance with DPCO 2013 Paragraph 26 and Essential Commodities Act price ceilings.`;

export const ContractAnalyzerPage: React.FC = () => {
  const [contractText, setContractText] = useState(SAMPLE_HIGH_RISK_CONTRACT);
  const [docName, setDocName] = useState('Draft_Monoclonal_Agreement.pdf');
  const [vendorName, setVendorName] = useState('Apex BioLogistics Pvt. Ltd.');
  const [loading, setLoading] = useState(false);
  const [packLoading, setPackLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<ContractAuditResponse | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'VIOLATION' | 'WARNING' | 'COMPLIANT'>('ALL');
  const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
  const [negotiationPack, setNegotiationPack] = useState<NegotiationPackResponse | null>(null);
  const [isPackModalOpen, setIsPackModalOpen] = useState(false);

  // Automatically run audit on mount with initial preset
  useEffect(() => {
    handleRunAudit();
  }, []);

  const handleRunAudit = async (customText?: string, customName?: string) => {
    setLoading(true);
    try {
      const textToAudit = customText !== undefined ? customText : contractText;
      const name = customName !== undefined ? customName : docName;
      const res = await auditContract(textToAudit, undefined, name);
      setAuditResult(res);
      // Auto-select clauses that are VIOLATION or WARNING
      const flagged = res.clauses
        .filter((c) => c.complianceStatus !== 'COMPLIANT')
        .map((c) => c.clauseId);
      setSelectedClauses(flagged);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sampleType: 'high-risk' | 'compliant') => {
    if (sampleType === 'high-risk') {
      setContractText(SAMPLE_HIGH_RISK_CONTRACT);
      setDocName('Draft_Monoclonal_Agreement_HighRisk.pdf');
      setVendorName('Apex BioLogistics Pvt. Ltd.');
      handleRunAudit(SAMPLE_HIGH_RISK_CONTRACT, 'Draft_Monoclonal_Agreement_HighRisk.pdf');
    } else {
      setContractText(SAMPLE_COMPLIANT_CONTRACT);
      setDocName('Schedule_M_Compliant_Contract.pdf');
      setVendorName('Bharat Parenterals Corp.');
      handleRunAudit(SAMPLE_COMPLIANT_CONTRACT, 'Schedule_M_Compliant_Contract.pdf');
    }
  };

  const handleToggleClauseSelect = (clauseId: string) => {
    setSelectedClauses((prev) =>
      prev.includes(clauseId) ? prev.filter((id) => id !== clauseId) : [...prev, clauseId]
    );
  };

  const handleGeneratePack = async () => {
    setPackLoading(true);
    try {
      const pack = await generateNegotiationPack({
        vendorName: vendorName || 'Supplier Legal Counsel',
        contractTitle: docName,
        flaggedClauses: selectedClauses,
      });
      setNegotiationPack(pack);
      setIsPackModalOpen(true);
    } catch (err) {
      console.error('Failed to generate pack:', err);
    } finally {
      setPackLoading(false);
    }
  };

  const filteredClauses = auditResult
    ? auditResult.clauses.filter((c) => {
        if (filter === 'ALL') return true;
        return c.complianceStatus === filter;
      })
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary/40 font-mono text-xs">
              Feature 6 • AI Statutory Audit
            </Badge>
            <Badge className="bg-emerald-600/20 text-emerald-300 border-emerald-500/30 text-xs">
              WHO TRS 1025 & DPCO 2013
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mt-1">
            Contract Intelligence & Redline Negotiation Pack
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Parses supplier agreements, cross-checks against CDSCO, Schedule M, and Indian contract law, and outputs statutory replacement clauses.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLoadSample('high-risk')}
            className="text-xs gap-1.5 border-rose-500/30 text-rose-300 hover:bg-rose-950/20"
          >
            <ShieldAlert className="size-3.5 text-rose-400" />
            <span>Load High-Risk Sample</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleLoadSample('compliant')}
            className="text-xs gap-1.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/20"
          >
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            <span>Load Compliant Sample</span>
          </Button>
        </div>
      </div>

      {/* Input Section & Audit Trigger */}
      <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-md">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span>Agreement Text & Metadata</span>
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              Document: {docName}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Counterparty Vendor Legal Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-md px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Apex BioLogistics Pvt. Ltd."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Document / Contract Title
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full bg-background border border-border/80 rounded-md px-3 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Master_Agreement.pdf"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Agreement Clauses (Paste raw text or edit sample below)
            </label>
            <textarea
              rows={5}
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              className="w-full bg-background border border-border/80 rounded-md p-3 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none resize-y"
              placeholder="Paste contract clauses here..."
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-primary" />
              <span>Audits cold chain (WHO TRS 1025), liability caps, cure periods, arbitration seats, and DPCO 2013 warranties.</span>
            </p>
            <Button
              onClick={() => handleRunAudit()}
              disabled={loading}
              className="px-5 text-xs gap-2 shadow-md"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Auditing Agreement...' : 'Audit Contract Clauses'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Results Section */}
      {auditResult && (
        <div className="space-y-6">
          {/* Summary Dashboard Banner */}
          <Card
            className={`border ${
              auditResult.overallContractRisk === 'HIGH'
                ? 'border-rose-500/50 bg-rose-950/20'
                : auditResult.overallContractRisk === 'MEDIUM'
                ? 'border-amber-500/50 bg-amber-950/20'
                : 'border-emerald-500/50 bg-emerald-950/20'
            } shadow-lg`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`${
                        auditResult.overallContractRisk === 'HIGH'
                          ? 'bg-rose-600 text-white'
                          : auditResult.overallContractRisk === 'MEDIUM'
                          ? 'bg-amber-600 text-white'
                          : 'bg-emerald-600 text-white'
                      } text-xs font-bold px-3 py-1 uppercase tracking-wider`}
                    >
                      {auditResult.overallContractRisk} RISK CONTRACT
                    </Badge>
                    <span className="text-xs font-mono text-muted-foreground">
                      Document: {auditResult.documentName}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {auditResult.summaryRationale}
                  </p>
                </div>

                {/* Stat Counters & Generate Pack Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="grid grid-cols-3 gap-2 shrink-0">
                    <div className="p-3 rounded-lg bg-background/80 border border-border/60 text-center min-w-[70px]">
                      <div className="text-xs text-rose-400 font-medium">Violations</div>
                      <div className="text-xl font-bold text-foreground">
                        {auditResult.violationsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-border/60 text-center min-w-[70px]">
                      <div className="text-xs text-amber-400 font-medium">Warnings</div>
                      <div className="text-xl font-bold text-foreground">
                        {auditResult.warningsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-border/60 text-center min-w-[70px]">
                      <div className="text-xs text-emerald-400 font-medium">Compliant</div>
                      <div className="text-xl font-bold text-foreground">
                        {auditResult.compliantCount}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleGeneratePack}
                    disabled={packLoading}
                    className="h-full py-3.5 px-4 bg-primary text-primary-foreground font-semibold text-xs gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Sparkles className={`size-4 ${packLoading ? 'animate-spin' : ''}`} />
                    <span>Generate Negotiation Pack</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground mr-1">Filter Clauses:</span>
              <Button
                variant={filter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('ALL')}
                className="h-7 text-xs"
              >
                All ({auditResult.totalClausesAnalyzed})
              </Button>
              <Button
                variant={filter === 'VIOLATION' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('VIOLATION')}
                className={`h-7 text-xs ${filter === 'VIOLATION' ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
              >
                Violations ({auditResult.violationsCount})
              </Button>
              <Button
                variant={filter === 'WARNING' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('WARNING')}
                className={`h-7 text-xs ${filter === 'WARNING' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
              >
                Warnings ({auditResult.warningsCount})
              </Button>
              <Button
                variant={filter === 'COMPLIANT' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('COMPLIANT')}
                className={`h-7 text-xs ${filter === 'COMPLIANT' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              >
                Compliant ({auditResult.compliantCount})
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              {selectedClauses.length} clause{selectedClauses.length === 1 ? '' : 's'} selected for counter-negotiation pack
            </div>
          </div>

          {/* Clause Cards List */}
          <div className="space-y-4">
            {filteredClauses.map((clause) => (
              <ClauseAuditCard
                key={clause.clauseId}
                clause={clause}
                isSelected={selectedClauses.includes(clause.clauseId)}
                onToggleSelect={handleToggleClauseSelect}
              />
            ))}
          </div>
        </div>
      )}

      {/* Negotiation Pack Modal */}
      {negotiationPack && (
        <NegotiationPackModal
          pack={negotiationPack}
          isOpen={isPackModalOpen}
          onClose={() => setIsPackModalOpen(false)}
        />
      )}
    </div>
  );
};
export default ContractAnalyzerPage;
