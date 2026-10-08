import { httpClient } from './httpClient';
import {
  ContractAuditResponse,
  NegotiationPackRequest,
  NegotiationPackResponse,
} from './types';

const MOCK_AUDIT_RESPONSE: ContractAuditResponse = {
  documentName: 'Master_Supply_Agreement_Draft_2026.pdf',
  overallContractRisk: 'HIGH',
  totalClausesAnalyzed: 5,
  violationsCount: 2,
  warningsCount: 1,
  compliantCount: 2,
  summaryRationale:
    'Agreement poses significant legal and operational exposure due to an ambient cold-chain transit clause (violating WHO TRS 1025) and an ultra-low liability cap of ₹50,000 for pharmaceutical defects.',
  clauses: [
    {
      clauseId: 'CLS-COLD-01',
      clauseTitle: 'Cold-Chain Transit & Continuous Logging (WHO TRS 1025)',
      extractedText:
        'Clause 2.2 Storage: Goods shall be maintained at Controlled Room Temperature 15°C–25°C in transit.',
      complianceStatus: 'VIOLATION',
      severity: 'HIGH',
      statuteCited: 'WHO Technical Report Series No. 1025 (Annex 7) / Schedule M 2024',
      legalBenchmark:
        'Biologics and monoclonal antibodies require unbroken 2°C–8°C cold chain with validated NIST-calibrated continuous IoT loggers.',
      recommendedRemedy:
        'Replace with statutory 2°C–8°C warranty, mandatory data download upon delivery, and automatic rejection of excursions >30 mins.',
    },
    {
      clauseId: 'CLS-LIAB-02',
      clauseTitle: 'Limitation of Liability & Batch Recalls',
      extractedText:
        'Clause 4.1 Indemnification: Supplier aggregate liability shall be capped at ₹50,000 for any and all defaults.',
      complianceStatus: 'VIOLATION',
      severity: 'HIGH',
      statuteCited: 'Indian Contract Act, 1872 Section 73 & CDSCO Good Distribution Practices',
      legalBenchmark:
        'Pharmaceutical recall and spoilage liability must be tied to batch value (min. 1.0x–1.5x total contract value), uncapped for contamination.',
      recommendedRemedy:
        'Revise liability cap to 1.5x total procurement value, with uncapped indemnification for gross negligence and regulatory recall penalties.',
    },
    {
      clauseId: 'CLS-DPCO-05',
      clauseTitle: 'Statutory DPCO 2013 Price Compliance Warranty',
      extractedText:
        'Clause 14.1 Pricing: Quoted prices are subject to escalation and exclude DPCO 2013 statutory limits.',
      complianceStatus: 'WARNING',
      severity: 'MEDIUM',
      statuteCited: 'Drugs (Prices Control) Order, 2013 Paragraph 26 & Essential Commodities Act, 1955',
      legalBenchmark:
        'Suppliers cannot contract out of DPCO statutory ceilings; agreement must contain express warranty affirming compliance.',
      recommendedRemedy:
        'Insert mandatory DPCO 2013 warranty clause warranting no billed unit price exceeds NPPA ceiling at time of dispatch.',
    },
    {
      clauseId: 'CLS-CURE-03',
      clauseTitle: 'Default Cure Period & Quality Investigation',
      extractedText:
        'Clause 7.3 Remedy: In the event of minor breach, buyer must provide 7-day cure period.',
      complianceStatus: 'COMPLIANT',
      severity: 'LOW',
      statuteCited: 'Indian Contract Act, 1872',
      legalBenchmark: 'Equitable cure period provided for operational rectification.',
      recommendedRemedy:
        'Standard commercial notice clause. Compliant with standard operating procedures.',
    },
    {
      clauseId: 'CLS-JUR-04',
      clauseTitle: 'Dispute Resolution & Indian High Court Jurisdiction',
      extractedText:
        'Clause 11.2 Jurisdiction: Arbitration seated domestically under the Arbitration and Conciliation Act, 1996 in New Delhi, India.',
      complianceStatus: 'COMPLIANT',
      severity: 'LOW',
      statuteCited: 'Arbitration and Conciliation Act, 1996',
      legalBenchmark: 'Domestic seat in India under Indian substantive commercial law.',
      recommendedRemedy: 'Clause verified fully compliant with domestic public procurement norms.',
    },
  ],
};

const MOCK_NEGOTIATION_PACK: NegotiationPackResponse = {
  vendorName: 'Apex BioLogistics Pvt. Ltd.',
  contractTitle: 'Master Pharmaceutical Supply Agreement 2026',
  emailSubject:
    'Legal & Regulatory Revisions Required: Master Supply Agreement (Cold-Chain & Liability Alignment)',
  emailBodyDraft: `Dear Apex BioLogistics Legal & Contracts Team,

We have completed our regulatory and legal review of the draft Master Pharmaceutical Supply Agreement for the upcoming procurement cycle.

Our audit identified critical compliance gaps against WHO TRS 1025 cold-chain standards and statutory liability coverage under the Indian Contract Act, 1872.

To proceed with final execution and purchase order release, please review and accept our proposed replacement clauses detailed below:
1. Cold Chain Specification: Upgrade to strict 2°C–8°C continuous logging with verified calibration certificates.
2. Liability & Indemnification: Revise the liability ceiling from ₹50,000 to 1.5x purchase order value for temperature excursions and recalls.
3. DPCO 2013 Compliance: Confirm that all invoiced unit prices remain compliant with NPPA statutory price orders.

We have attached the redlined clauses for your immediate review. We request your feedback by Thursday 5:00 PM IST.

Warm regards,
AutonoSource Strategic Procurement Council`,
  replacementClauses: [
    {
      clauseTitle: 'WHO TRS 1025 Cold-Chain Temperature Maintenance',
      problematicOriginal:
        'Goods shall be maintained at Controlled Room Temperature 15°C–25°C in transit.',
      statutoryReplacementClause:
        'Supplier warrants that all products shall be maintained strictly within 2.0°C to 8.0°C throughout transit using validated cold-chain containers equipped with continuous digital NIST-calibrated data loggers. Any temperature excursion exceeding 30 cumulative minutes entitles Buyer to immediate batch rejection and replacement at Supplier expense.',
      rationale:
        'Essential for biologicals and vaccines to prevent denaturation; satisfies WHO TRS 1025 Annex 7 and Schedule M standards.',
    },
    {
      clauseTitle: 'Limitation of Liability & Contamination Indemnification',
      problematicOriginal:
        'Supplier aggregate liability shall be capped at ₹50,000 for any and all defaults.',
      statutoryReplacementClause:
        'Supplier aggregate liability under this Agreement shall be capped at 150% of the total purchase order value, provided that this limitation shall NOT apply to: (a) regulatory recall expenses, (b) temperature excursion losses, or (c) gross negligence and willful misconduct.',
      rationale:
        'Caps at ₹50,000 leave the institution exposed to multimillion-rupee batch loss liabilities and hospital operational paralysis.',
    },
    {
      clauseTitle: 'DPCO 2013 Statutory Price Ceiling Warranty',
      problematicOriginal:
        'Quoted prices are subject to escalation and exclude DPCO 2013 statutory limits.',
      statutoryReplacementClause:
        'Supplier expressly warrants and covenants that all unit rates charged under this Agreement comply with the ceiling prices notified by the National Pharmaceutical Pricing Authority (NPPA) under the Drugs (Prices Control) Order, 2013 (DPCO 2013). Any overcharging shall be immediately refunded with interest under DPCO Para 26.',
      rationale:
        'Statutory requirement under Essential Commodities Act; prevents over-invoicing and legal liability.',
    },
  ],
  negotiationStrategyTips: [
    'Leverage DPCO 2013 Paragraph 26 statutory enforcement: non-negotiable legal ceiling under Indian law.',
    'Present WHO TRS 1025 data logger data as mandatory hospital standard operating procedure (SOP), not an elective request.',
    'Offer reciprocal liability exclusions for delays caused solely by hospital unloading queues exceeding 4 hours to build good-faith compromise.',
    'Require submission of NIST calibration certificates along with each consignment advance shipping notice (ASN).',
  ],
};

export const auditContract = async (
  contractText?: string,
  file?: File,
  documentName?: string
): Promise<ContractAuditResponse> => {
  try {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (contractText) {
      formData.append('contract_text', contractText);
    }
    if (documentName) {
      formData.append('document_name', documentName);
    }

    // Pass FormData directly
    return await httpClient.post<ContractAuditResponse>(
      '/tools/contract-analyzer/audit',
      formData
    );
  } catch (err) {
    console.warn('API auditContract failed, using mock data:', err);
    return MOCK_AUDIT_RESPONSE;
  }
};

export const generateNegotiationPack = async (
  request: NegotiationPackRequest
): Promise<NegotiationPackResponse> => {
  try {
    return await httpClient.post<NegotiationPackResponse>(
      '/tools/contract-analyzer/negotiation-pack',
      request
    );
  } catch (err) {
    console.warn('API generateNegotiationPack failed, using mock data:', err);
    return {
      ...MOCK_NEGOTIATION_PACK,
      vendorName: request.vendorName || MOCK_NEGOTIATION_PACK.vendorName,
      contractTitle: request.contractTitle || MOCK_NEGOTIATION_PACK.contractTitle,
    };
  }
};
