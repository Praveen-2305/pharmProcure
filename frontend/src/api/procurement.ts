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

// Initial case ledger for active evaluation
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
    id: 'PR-2026-8801-BIO',
    vendorName: 'BioGen Diagnostics Inc.',
    dealSize: 450000,
    details: 'Procurement of diagnostic molecular test kits and annual calibration maintenance.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: {
      procurementId: 'PR-2026-8801-BIO',
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
            text: 'FDA Inspection Database confirms zero 483 citations or Warning Letters across all registered facilities.',
            source: 'graph',
            retrieverScore: 0.98,
            sourceWeight: 1.0,
            finalScore: 0.98,
            isPrimary: true,
            contradictionFlag: false,
          },
          {
            factId: 'fact-bg-3',
            text: 'Master Services Agreement includes standard 30-day cure period for SLA breaches.',
            source: 'vector',
            retrieverScore: 0.92,
            sourceWeight: 0.9,
            finalScore: 0.828,
            isPrimary: true,
            contradictionFlag: false,
          },
        ],
      },
      riskAssessment: {
        financialRisk: {
          level: 'LOW',
          rationale: 'Liquid balance sheet with quick ratio > 1.8. Low probability of commercial default.',
        },
        complianceRisk: {
          level: 'LOW',
          rationale: 'Fully certified ISO 13485 facility with unblemished FDA inspection track record.',
        },
        contractRisk: {
          level: 'LOW',
          rationale: 'Balanced liability limits and customary termination terms.',
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
        'All 4 risk dimensions scored LOW with 94% verifiable evidence coverage across SEC and FDA databases.',
      recommendation:
        'Approve procurement contract with standard warranty and annual calibration SLA schedule.',
    },
  },
  {
    id: 'PR-2026-8802-MSI',
    vendorName: 'MediSupply Global Logistics',
    dealSize: 890000,
    details: 'Cold-chain storage and distribution vendor for temperature-sensitive reagents across APAC.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: {
      procurementId: 'PR-2026-8802-MSI',
      stage: 'COMPLETE',
      investigationPlan: 'FULL',
      revisionCount: 1,
      maxRevisions: 3,
    },
    report: {
      vendorSummary:
        'MediSupply Global provides logistics for pharmaceutical cold chains. A critical contradiction between self-disclosed compliance and FDA warning history was flagged and resolved.',
      financialAssessment:
        'Adequate debt service coverage (1.4x), but operating margins compressed due to fuel inflation.',
      complianceFindings:
        'FDA Warning Letter (WL-2024-0982) active regarding temperature excursions in Singapore distribution facility.',
      flaggedContractClauses: [
        'Section 6.4: Liability for spoiled biological materials capped at $50,000 per shipment.',
        'Section 11.2: Force Majeure includes ambient temperature events exceeding 35°C.',
      ],
      evidenceSummary:
        'Contradiction detected: Self-disclosed audit certificate claimed unblemished FDA status; Knowledge Graph retrieved active Warning Letter.',
      fusedContext: {
        overallConfidence: 0.88,
        fallbackToVectorOnly: false,
        facts: [
          {
            factId: 'fact-ms-1',
            text: 'FDA Warning Letter WL-2024-0982 citing uncalibrated continuous cold-chain temperature loggers in Singapore depot.',
            source: 'graph',
            retrieverScore: 0.99,
            sourceWeight: 1.0,
            finalScore: 0.99,
            isPrimary: true,
            contradictionFlag: true,
            conflictsWith: 'fact-ms-2',
          },
          {
            factId: 'fact-ms-2',
            text: 'Vendor RFP response claims: "Zero regulatory findings or warning letters across all global operations (2022-2025)"',
            source: 'vector',
            retrieverScore: 0.94,
            sourceWeight: 0.6,
            finalScore: 0.564,
            isPrimary: false,
            contradictionFlag: true,
            conflictsWith: 'fact-ms-1',
          },
          {
            factId: 'fact-ms-3',
            text: 'Liability for cargo spoilage capped at $50,000 against typical batch values of $300,000.',
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
          rationale: 'Moderate liquidity with debt maturity obligations within 12 months.',
        },
        complianceRisk: {
          level: 'HIGH',
          rationale: 'Active FDA Warning Letter for temperature control failure unresolved in knowledge graph ontology.',
        },
        contractRisk: {
          level: 'HIGH',
          rationale: 'Severe indemnification gap: $50,000 liability cap on $300,000 average shipment value.',
        },
        pricingRisk: {
          status: 'WITHIN_CEILING',
          ceilingPrice: 950000,
          quotedPrice: 890000,
        },
        overallRisk: 'HIGH',
        confidenceScore: 0.88,
      },
      riskExplanation:
        'High compliance risk from unaddressed FDA Warning Letter compounded by high contract risk from inadequate spoilage liability coverage.',
      recommendation:
        'Reject or suspend until vendor proves FDA Warning Letter closeout and amends Section 6.4 payload insurance.',
    },
  },
  {
    id: 'PR-2026-8803-PCT',
    vendorName: 'PhytoChem Novel Therapeutics',
    dealSize: 620000,
    details: 'Custom chiral intermediate synthesis for Phase 1 candidate pipeline.',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: {
      procurementId: 'PR-2026-8803-PCT',
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
        'DEA Schedule II-V registered analytical laboratory. Good Laboratory Practices (GLP) certified.',
      flaggedContractClauses: [
        'Section 4.1: Intellectual property created during custom pathway development vests with vendor unless buy-out fee paid.',
      ],
      evidenceSummary:
        'Novel synthesis compound has no direct category benchmark pricing data in historical index.',
      fusedContext: {
        overallConfidence: 0.68,
        fallbackToVectorOnly: true,
        facts: [
          {
            factId: 'fact-pc-1',
            text: 'DEA research registration valid through 2027 for Schedule I-IV controlled substance research.',
            source: 'graph',
            retrieverScore: 0.95,
            sourceWeight: 1.0,
            finalScore: 0.95,
            isPrimary: true,
            contradictionFlag: false,
          },
          {
            factId: 'fact-pc-2',
            text: 'No historical procurement matches for 7-step asymmetric chiral synthesis in category index.',
            source: 'vector',
            retrieverScore: 0.72,
            sourceWeight: 0.9,
            finalScore: 0.648,
            isPrimary: true,
            contradictionFlag: false,
          },
        ],
      },
      riskAssessment: {
        financialRisk: {
          level: 'MEDIUM',
          rationale: 'Series A startup dependent on venture milestone tranches.',
        },
        complianceRisk: {
          level: 'LOW',
          rationale: 'Active DEA credentials and certified GLP laboratory protocols.',
        },
        contractRisk: {
          level: 'HIGH',
          rationale: 'IP retention clause contradicts enterprise procurement standard assignment policy.',
        },
        pricingRisk: {
          status: 'INDETERMINATE',
          quotedPrice: 620000,
        },
        overallRisk: 'MEDIUM',
        confidenceScore: 0.68,
      },
      riskExplanation:
        'Pricing Risk is explicitly INDETERMINATE because this custom synthesis lacks market pricing datasets. Financial viability is moderate based on Series A cash runway.',
      recommendation:
        'Proceed with milestone-based payment structure contingent on technical yield verification.',
    },
  },
  {
    id: 'PR-2026-8804-NPH',
    vendorName: 'NanoPharma Automation Corp',
    dealSize: 1450000,
    details: 'Cleanroom high-throughput vial filling and automated inspection robotics.',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    status: {
      procurementId: 'PR-2026-8804-NPH',
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
    id: 'PR-2026-8805-UKN',
    vendorName: 'OmniSpec Unknown LLC',
    dealSize: 120000,
    details: 'Unregistered foreign reagent distributor with unverified tax identifier.',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    status: {
      procurementId: 'PR-2026-8805-UKN',
      stage: 'FAILED',
      investigationPlan: 'LIGHT',
      revisionCount: 0,
      maxRevisions: 3,
      failureReason: 'Vendor record not found in corporate registries or D&B database. Workflow terminated per compliance protocol §8.3.',
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
    if (request.vendorName.toLowerCase().includes('unknown') || request.vendorName.toLowerCase().includes('fail')) {
      status.stage = 'FAILED';
      status.failureReason = 'Vendor record not found in corporate registries or D&B database (Compliance Protocol §8.3).';
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
