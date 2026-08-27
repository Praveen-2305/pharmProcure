import {
  ProcurementReport,
  SubmitProcurementRequest,
  WorkflowStatus,
  ProcurementItemSummary,
} from './types';

export interface ProcurementAPI {
  submitRequest(request: SubmitProcurementRequest): Promise<{ procurementId: string; status: WorkflowStatus }>;
  getStatus(procurementId: string): Promise<WorkflowStatus>;
  getReport(procurementId: string): Promise<ProcurementReport | null>;
  getAllProcurements(): Promise<ProcurementItemSummary[]>;
}

// In-memory store for mock execution
const mockStore: Map<
  string,
  {
    vendorName: string;
    dealSize: number;
    procurementDetails: string;
    status: WorkflowStatus;
    report?: ProcurementReport;
    createdAt: string;
  }
> = new Map();

// Seed initial cases for immediate evaluation and demoing
const SEED_DATA: Array<{
  id: string;
  vendorName: string;
  dealSize: number;
  details: string;
  status: WorkflowStatus;
  report?: ProcurementReport;
  createdAt: string;
}> = [
  {
    id: 'seed-clean-biogen',
    vendorName: 'BioGen Diagnostics Inc.',
    dealSize: 450000,
    details: 'Procurement of diagnostic molecular test kits and annual calibration maintenance.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: {
      procurementId: 'seed-clean-biogen',
      stage: 'COMPLETE',
      investigationPlan: 'FULL',
      revisionCount: 0,
      maxRevisions: 3,
    },
    report: {
      vendorSummary:
        'BioGen Diagnostics is a tier-1 certified biomedical manufacturer with established FDA GMP compliance history and 12 years of audited financial stability.',
      financialAssessment:
        'Strong Altman Z-score (3.42). Current ratio 2.1x. No active litigation or default risk detected.',
      complianceFindings:
        'ISO 13485 and FDA 21 CFR Part 820 compliant. Zero 483 inspection citations in past 36 months.',
      flaggedContractClauses: [
        'Section 9.2: Mutual indemnification capped at 1.5x deal value (Acceptable).',
        'Section 14.1: Standard 30-day termination for convenience.',
      ],
      evidenceSummary:
        'High degree of agreement across Knowledge Graph regulatory records and Vector Store SEC filings.',
      fusedContext: {
        overallConfidence: 0.94,
        fallbackToVectorOnly: false,
        facts: [
          {
            factId: 'fact-bg-1',
            text: 'Audited balance sheet (FY2025) confirms $45M working capital against $12M total debt.',
            source: 'vector',
            retrieverScore: 0.96,
            sourceWeight: 0.9,
            finalScore: 0.864,
            isPrimary: true,
            contradictionFlag: false,
          },
          {
            factId: 'fact-bg-2',
            text: 'FDA Inspection Database confirms zero Form 483s issued at Boston facility (2023-2025).',
            source: 'graph',
            retrieverScore: 0.95,
            sourceWeight: 1.0,
            finalScore: 0.95,
            isPrimary: true,
            contradictionFlag: false,
          },
          {
            factId: 'fact-bg-3',
            text: 'D&B Paydex Score rated 84 (Prompt payment behavior across 14 suppliers).',
            source: 'vector',
            retrieverScore: 0.91,
            sourceWeight: 0.85,
            finalScore: 0.773,
            isPrimary: true,
            contradictionFlag: false,
          },
        ],
      },
      riskAssessment: {
        financialRisk: {
          level: 'LOW',
          rationale: 'Robust liquidity, zero debt defaults, profitable 4 consecutive quarters.',
        },
        complianceRisk: {
          level: 'LOW',
          rationale: 'Clean FDA inspection trail and active ISO certificates validated via official registry.',
        },
        contractRisk: {
          level: 'LOW',
          rationale: 'Standard boilerplate clauses with equitable liability cap and breach remediation clauses.',
        },
        pricingRisk: {
          status: 'WITHIN_CEILING',
          ceilingPrice: 500000,
          quotedPrice: 450000,
        },
        overallRisk: 'LOW',
        confidenceScore: 0.94,
      },
      riskExplanation:
        'Vendor represents low operational and financial risk. Strong liquidity combined with faultless regulatory compliance justifies standard procurement approval.',
      recommendation:
        'Approve standard master service agreement with annual compliance audit check-ins.',
    },
  },
  {
    id: 'seed-contradiction-medisupply',
    vendorName: 'MediSupply Global Logistics',
    dealSize: 890000,
    details: 'Cold-chain storage and distribution vendor for temperature-sensitive reagents across APAC.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: {
      procurementId: 'seed-contradiction-medisupply',
      stage: 'COMPLETE',
      investigationPlan: 'FULL',
      revisionCount: 1,
      maxRevisions: 3,
    },
    report: {
      vendorSummary:
        'MediSupply is a multi-regional cold-chain logistics provider. A critical discrepancy was uncovered between self-reported audit certifications in the RFP document and live FDA CDER enforcement records.',
      financialAssessment:
        'Adequate working capital, but exposure to potential regulatory penalties in regional hubs.',
      complianceFindings:
        'FDA Import Alert #66-40 issued in Q2 2024 for temperature logging failure at Singapore transit facility. Discrepant with self-certified clean record in RFP contract attachments.',
      flaggedContractClauses: [
        'Section 6.4: Liability for temperature excursion limited to freight fee rather than product value (High Exposure).',
        'Section 12: Force majeure includes broad undefined "supply disruption" language.',
      ],
      evidenceSummary:
        'Hybrid RAG conflict detection triggered: Graph knowledge node containing official FDA warning letter superseded vector similarity snippet of outdated 2023 internal audit report.',
      fusedContext: {
        overallConfidence: 0.79,
        fallbackToVectorOnly: false,
        facts: [
          {
            factId: 'fact-ms-graph-01',
            text: 'FDA Warning Letter CDER-2024-09 issued May 2024: 3 thermal excursions detected on lyophilized cargo, remediation pending verification.',
            source: 'graph',
            retrieverScore: 0.98,
            sourceWeight: 1.0,
            finalScore: 0.98,
            isPrimary: true,
            contradictionFlag: true,
            conflictsWith: 'fact-ms-vec-02',
          },
          {
            factId: 'fact-ms-vec-02',
            text: 'Vendor RFP Exhibit B states "Zero temperature deviations recorded across all pharma transport operations in past 24 months."',
            source: 'vector',
            retrieverScore: 0.88,
            sourceWeight: 0.75,
            finalScore: 0.66,
            isPrimary: false,
            contradictionFlag: true,
            conflictsWith: 'fact-ms-graph-01',
          },
          {
            factId: 'fact-ms-3',
            text: 'Dun & Bradstreet Viability rating 4 (Moderate financial stability; low bankruptcy risk).',
            source: 'vector',
            retrieverScore: 0.84,
            sourceWeight: 0.85,
            finalScore: 0.714,
            isPrimary: true,
            contradictionFlag: false,
          },
        ],
      },
      riskAssessment: {
        financialRisk: {
          level: 'MEDIUM',
          rationale: 'Revenue stable, but uninsured thermal excursion claims may create liability drag.',
        },
        complianceRisk: {
          level: 'HIGH',
          rationale: 'Active unresolved FDA Warning Letter contradicting vendor self-disclosures.',
        },
        contractRisk: {
          level: 'HIGH',
          rationale: 'Clause 6.4 restricts reimbursement to carrier freight cost ($15K) on $890K payload.',
        },
        pricingRisk: {
          status: 'WITHIN_CEILING',
          ceilingPrice: 950000,
          quotedPrice: 890000,
        },
        overallRisk: 'HIGH',
        confidenceScore: 0.79,
      },
      riskExplanation:
        'Unresolved contradiction between vector RFP text and authoritative FDA graph node reveals masked regulatory exposure and deficient cargo indemnity clauses.',
      recommendation:
        'Reject or suspend until vendor proves FDA Warning Letter closeout and amends Section 6.4 payload insurance.',
    },
  },
  {
    id: 'seed-indeterminate-phytochem',
    vendorName: 'PhytoChem Novel Therapeutics',
    dealSize: 620000,
    details: 'Custom chiral intermediate synthesis for Phase 1 candidate pipeline.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: {
      procurementId: 'seed-indeterminate-phytochem',
      stage: 'COMPLETE',
      investigationPlan: 'LIGHT',
      revisionCount: 0,
      maxRevisions: 3,
    },
    report: {
      vendorSummary:
        'PhytoChem is a specialized chemical synthesis startup offering bespoke reaction pathway services for proprietary pharmaceutical molecules.',
      financialAssessment:
        'Early-stage biotechnology venture with 18-month cash runway backed by Series A venture funding.',
      complianceFindings:
        'DEA chemical precursor registration confirmed. cGMP compliant pilot batch facility.',
      flaggedContractClauses: [
        'Section 4.1: Background IP rights retained by vendor on proprietary catalysts.',
      ],
      evidenceSummary:
        'No direct historical benchmark pricing exists for this novel custom stereoisomer synthesis in internal procurement databases or market index feeds.',
      fusedContext: {
        overallConfidence: 0.72,
        fallbackToVectorOnly: true,
        facts: [
          {
            factId: 'fact-pc-1',
            text: 'Vendor registered with US DEA for Controlled Substance Precursor Schedule II handling.',
            source: 'vector',
            retrieverScore: 0.94,
            sourceWeight: 0.9,
            finalScore: 0.846,
            isPrimary: true,
            contradictionFlag: false,
          },
          {
            factId: 'fact-pc-2',
            text: 'Historical database lookup for CAS #149202-88-1 yielded 0 internal and external benchmark matches.',
            source: 'vector',
            retrieverScore: 0.89,
            sourceWeight: 0.9,
            finalScore: 0.801,
            isPrimary: true,
            contradictionFlag: false,
          },
        ],
      },
      riskAssessment: {
        financialRisk: {
          level: 'MEDIUM',
          rationale: 'Pre-revenue startup structure; financial solvency relies on ongoing milestone funding.',
        },
        complianceRisk: {
          level: 'LOW',
          rationale: 'Regulatory precursor licenses fully authenticated.',
        },
        contractRisk: {
          level: 'MEDIUM',
          rationale: 'Catalyst IP ownership retention requires legal alignment.',
        },
        pricingRisk: {
          status: 'INDETERMINATE',
          quotedPrice: 620000,
        },
        overallRisk: 'MEDIUM',
        confidenceScore: 0.72,
      },
      riskExplanation:
        'Pricing Risk is explicitly INDETERMINATE because this custom synthesis lacks market pricing datasets. Financial viability is moderate based on Series A cash runway.',
      recommendation:
        'Proceed with milestone-based payment structure contingent on technical yield verification.',
    },
  },
  {
    id: 'seed-exceeds-ceiling-nanopharma',
    vendorName: 'NanoPharma Automation Corp',
    dealSize: 1450000,
    details: 'Cleanroom high-throughput vial filling and automated inspection robotics.',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: {
      procurementId: 'seed-exceeds-ceiling-nanopharma',
      stage: 'AWAITING_APPROVAL',
      investigationPlan: 'FULL',
      revisionCount: 2,
      maxRevisions: 3,
    },
    report: {
      vendorSummary:
        'NanoPharma manufactures automated aseptic vial handling systems. The quote significantly surpasses category procurement ceiling guidelines.',
      financialAssessment:
        'Public enterprise (NASDAQ: NPHR) with strong balance sheet and $240M annual revenues.',
      complianceFindings:
        'Annex 1 EU GMP and GAMP 5 compliant automated software controls.',
      flaggedContractClauses: [
        'Section 8: Software licensing billed separately as mandatory annual subscription ($85K/yr).',
      ],
      evidenceSummary:
        'Pricing matrix matched historical enterprise purchases for equivalent 12-head vial filling systems ($1,100,000 ceiling).',
      fusedContext: {
        overallConfidence: 0.91,
        fallbackToVectorOnly: false,
        facts: [
          {
            factId: 'fact-np-1',
            text: 'Historical category ceiling established at $1,100,000 based on 4 comparable purchases in FY24.',
            source: 'graph',
            retrieverScore: 0.96,
            sourceWeight: 1.0,
            finalScore: 0.96,
            isPrimary: true,
            contradictionFlag: false,
          },
          {
            factId: 'fact-np-2',
            text: 'Vendor quote itemizes hardware at $1.25M and validation support at $200K, totaling $1.45M.',
            source: 'vector',
            retrieverScore: 0.95,
            sourceWeight: 0.9,
            finalScore: 0.855,
            isPrimary: true,
            contradictionFlag: false,
          },
        ],
      },
      riskAssessment: {
        financialRisk: {
          level: 'LOW',
          rationale: 'Publicly listed company with audited reserves and $240M ARR.',
        },
        complianceRisk: {
          level: 'LOW',
          rationale: 'GAMP 5 validation pack included with FAT/SAT protocol support.',
        },
        contractRisk: {
          level: 'MEDIUM',
          rationale: 'Mandatory recurring software license increases 5-year Total Cost of Ownership.',
        },
        pricingRisk: {
          status: 'EXCEEDS_CEILING',
          ceilingPrice: 1100000,
          quotedPrice: 1450000,
          excessAmount: 350000,
        },
        overallRisk: 'HIGH',
        confidenceScore: 0.91,
      },
      riskExplanation:
        'Quote exceeds department procurement ceiling by $350,000 (31.8% over budget ceiling). Executive waiver or counter-offer required.',
      recommendation:
        'Negotiate price reduction down to $1,100,000 or require vendor to include 3 years of validation software support in baseline pricing.',
    },
  },
  {
    id: 'seed-failure-missing-vendor',
    vendorName: 'OmniSpec Unknown LLC',
    dealSize: 120000,
    details: 'Unregistered foreign reagent distributor with unverified tax identifier.',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: {
      procurementId: 'seed-failure-missing-vendor',
      stage: 'FAILED',
      investigationPlan: 'LIGHT',
      revisionCount: 0,
      maxRevisions: 3,
      failureReason: 'Vendor record not found in corporate registries or D&B database. Workflow terminated per compliance protocols (POC §8.3).',
    },
  },
];

// Initialize seed data into store
SEED_DATA.forEach((item) => {
  mockStore.set(item.id, {
    vendorName: item.vendorName,
    dealSize: item.dealSize,
    procurementDetails: item.details,
    status: item.status,
    report: item.report,
    createdAt: item.createdAt,
  });
});

// Helper for dynamic stage progression
function simulateWorkflowProgression(procurementId: string) {
  const stages: Array<{ stage: WorkflowStatus['stage']; delay: number; revision?: number }> = [
    { stage: 'PLANNING', delay: 1000 },
    { stage: 'EXECUTING', delay: 2800 },
    { stage: 'SCORING', delay: 4800 },
    { stage: 'CRITIQUING', delay: 6800, revision: 1 },
    { stage: 'EXECUTING', delay: 8800, revision: 1 },
    { stage: 'WRITING_REPORT', delay: 11000, revision: 1 },
    { stage: 'AWAITING_APPROVAL', delay: 13500, revision: 1 },
  ];

  stages.forEach(({ stage, delay, revision }) => {
    setTimeout(() => {
      const entry = mockStore.get(procurementId);
      if (!entry || entry.status.stage === 'FAILED' || entry.status.stage === 'COMPLETE') return;

      entry.status.stage = stage;
      if (revision !== undefined) {
        entry.status.revisionCount = revision;
      }

      if (stage === 'AWAITING_APPROVAL' || stage === 'COMPLETE') {
        entry.report = generateMockReport(entry.vendorName, entry.dealSize, entry.procurementDetails);
      }
      mockStore.set(procurementId, entry);
    }, delay);
  });
}

function generateMockReport(vendorName: string, dealSize: number, details: string): ProcurementReport {
  const ceiling = Math.round(dealSize * 1.15);
  return {
    vendorSummary: `${vendorName} was evaluated across multi-source financial statements, regulatory databases, and contract clauses for: "${details.slice(0, 100)}...".`,
    financialAssessment:
      'Healthy liquidity ratio (1.8x) with consistent positive operating cash flow over past 3 fiscal years.',
    complianceFindings:
      'All regulatory registrations validated. No critical warning letters or active debarments identified.',
    flaggedContractClauses: [
      'Section 11.2: Standard 30-day notice for price adjustments.',
      'Section 18.0: Governing law in Delaware with standard arbitration.',
    ],
    evidenceSummary:
      'Fused findings across Vector embeddings of supplied contract RFP and Graph ontology of regulatory licenses.',
    fusedContext: {
      overallConfidence: 0.88,
      fallbackToVectorOnly: false,
      facts: [
        {
          factId: `fact-${Date.now()}-1`,
          text: `Regulatory compliance verification confirmed active license with State Board of Pharmacy for ${vendorName}.`,
          source: 'graph',
          retrieverScore: 0.94,
          sourceWeight: 1.0,
          finalScore: 0.94,
          isPrimary: true,
          contradictionFlag: false,
        },
        {
          factId: `fact-${Date.now()}-2`,
          text: `Financial balance sheet analysis indicates positive net margins and manageable debt-to-equity ratio.`,
          source: 'vector',
          retrieverScore: 0.89,
          sourceWeight: 0.85,
          finalScore: 0.756,
          isPrimary: true,
          contradictionFlag: false,
        },
      ],
    },
    riskAssessment: {
      financialRisk: {
        level: 'LOW',
        rationale: 'Sound balance sheet with verified positive liquidity cushion.',
      },
      complianceRisk: {
        level: 'LOW',
        rationale: 'Active license and zero safety infractions in past 24 months.',
      },
      contractRisk: {
        level: 'MEDIUM',
        rationale: 'Requires clarification on annual price escalations in clause 11.2.',
      },
      pricingRisk: {
        status: 'WITHIN_CEILING',
        ceilingPrice: ceiling,
        quotedPrice: dealSize,
      },
      overallRisk: 'LOW',
      confidenceScore: 0.88,
    },
    riskExplanation:
      'Vendor qualifies under standard commercial terms with solid financial stability and verified compliance.',
    recommendation: 'Approve procurement with minor clause clarification on pricing caps.',
  };
}

export const mockProcurementAPI: ProcurementAPI = {
  async submitRequest(request: SubmitProcurementRequest) {
    const id = `proc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const status: WorkflowStatus = {
      procurementId: id,
      stage: 'PLANNING',
      investigationPlan: request.investigationPlan || 'FULL',
      revisionCount: 0,
      maxRevisions: 3,
    };

    // Edge-case simulation for missing vendor name "FAIL_VENDOR"
    if (request.vendorName.toUpperCase().includes('FAIL_VENDOR')) {
      status.stage = 'FAILED';
      status.failureReason = 'Vendor record not found in corporate registries or D&B database (POC §8.3).';
    }

    mockStore.set(id, {
      vendorName: request.vendorName,
      dealSize: request.dealSize,
      procurementDetails: request.procurementDetails,
      status,
      createdAt: new Date().toISOString(),
    });

    if (status.stage !== 'FAILED') {
      simulateWorkflowProgression(id);
    }

    return { procurementId: id, status };
  },

  async getStatus(procurementId: string): Promise<WorkflowStatus> {
    const item = mockStore.get(procurementId);
    if (!item) {
      return {
        procurementId,
        stage: 'FAILED',
        investigationPlan: 'FULL',
        revisionCount: 0,
        maxRevisions: 3,
        failureReason: 'Procurement record not found or expired.',
      };
    }
    return item.status;
  },

  async getReport(procurementId: string): Promise<ProcurementReport | null> {
    const item = mockStore.get(procurementId);
    return item?.report || null;
  },

  async getAllProcurements(): Promise<ProcurementItemSummary[]> {
    const list: ProcurementItemSummary[] = [];
    mockStore.forEach((value, key) => {
      list.push({
        procurementId: key,
        vendorName: value.vendorName,
        dealSize: value.dealSize,
        status: value.status,
        report: value.report,
        createdAt: value.createdAt,
      });
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
};

// HTTP Implementation calling FastAPI endpoints
export const httpProcurementAPI: ProcurementAPI = {
  async submitRequest(request: SubmitProcurementRequest) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('vendorName', request.vendorName);
    formData.append('dealSize', request.dealSize.toString());
    formData.append('procurementDetails', request.procurementDetails);
    if (request.investigationPlan) {
      formData.append('investigationPlan', request.investigationPlan);
    }
    if (request.contractDocument instanceof File) {
      formData.append('contractDocument', request.contractDocument);
    }

    const res = await fetch(`${baseUrl}/procurement/submit`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Failed to submit procurement: ${res.statusText}`);
    }
    return res.json();
  },

  async getStatus(procurementId: string): Promise<WorkflowStatus> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const res = await fetch(`${baseUrl}/procurement/${procurementId}/status`);
    if (!res.ok) {
      throw new Error(`Failed to fetch status: ${res.statusText}`);
    }
    return res.json();
  },

  async getReport(procurementId: string): Promise<ProcurementReport | null> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const res = await fetch(`${baseUrl}/procurement/${procurementId}/report`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch report: ${res.statusText}`);
    }
    return res.json();
  },

  async getAllProcurements(): Promise<ProcurementItemSummary[]> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const res = await fetch(`${baseUrl}/procurement/all`);
    if (!res.ok) {
      throw new Error(`Failed to fetch procurements: ${res.statusText}`);
    }
    return res.json();
  },
};
