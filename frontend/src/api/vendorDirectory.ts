import { httpClient } from './httpClient';
import { VendorDirectoryResponse, Vendor360Response } from './types';

const MOCK_DIRECTORY_RESPONSE: VendorDirectoryResponse = {
  total: 4,
  currency: 'INR',
  vendors: [
    {
      vendorId: 'VND-002',
      vendorName: 'Bharat Biotherapeutics Labs',
      productCategory: 'Biologics & Vaccines',
      country: 'India',
      state: 'Gujarat',
      city: 'Ahmedabad',
      creditRating: 'AAA',
      annualRevenueInrCr: 480.0,
      solvencyRatio: 2.85,
      whoTrs1025Compliant: true,
      scheduleMCompliant: true,
      coldChainCapable: true,
      auditRiskLevel: 'LOW',
      caseCount: 4,
      productCount: 12,
      otifRatePercent: 98.4,
      compositeQualityScore: 94,
    },
    {
      vendorId: 'VND-001',
      vendorName: 'Apex Pharma Chem Solutions',
      productCategory: 'Specialty Injectables',
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai',
      creditRating: 'BBB',
      annualRevenueInrCr: 120.0,
      solvencyRatio: 1.45,
      whoTrs1025Compliant: false,
      scheduleMCompliant: true,
      coldChainCapable: false,
      auditRiskLevel: 'HIGH',
      caseCount: 3,
      productCount: 8,
      otifRatePercent: 89.5,
      compositeQualityScore: 68,
    },
    {
      vendorId: 'VND-005',
      vendorName: 'Biological E-Safe Vaccines Ltd.',
      productCategory: 'Pediatric & Adult Vaccines',
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      creditRating: 'AA',
      annualRevenueInrCr: 310.0,
      solvencyRatio: 2.4,
      whoTrs1025Compliant: true,
      scheduleMCompliant: true,
      coldChainCapable: true,
      auditRiskLevel: 'LOW',
      caseCount: 2,
      productCount: 9,
      otifRatePercent: 97.8,
      compositeQualityScore: 91,
    },
    {
      vendorId: 'VND-006',
      vendorName: 'Gland Sterile Injectables India',
      productCategory: 'Oncology Sterile Injectables',
      country: 'India',
      state: 'Andhra Pradesh',
      city: 'Visakhapatnam',
      creditRating: 'A',
      annualRevenueInrCr: 215.0,
      solvencyRatio: 2.1,
      whoTrs1025Compliant: true,
      scheduleMCompliant: true,
      coldChainCapable: true,
      auditRiskLevel: 'MEDIUM',
      caseCount: 1,
      productCount: 6,
      otifRatePercent: 94.2,
      compositeQualityScore: 84,
    },
  ],
};

const MOCK_360_RESPONSE: Vendor360Response = {
  vendorId: 'VND-002',
  vendorName: 'Bharat Biotherapeutics Labs',
  productCategory: 'Biologics & Vaccines',
  country: 'India',
  state: 'Gujarat',
  city: 'Ahmedabad',
  headquartersAddress: 'Plot 45, GIDC Industrial Estate, Sanand, Ahmedabad, Gujarat 382110',
  contactEmail: 'regulatory@bharatbio.co.in',
  contactPhone: '+91 79 2680 9100',
  taxIdentificationNumber: '24AABCB1294F1Z8',
  drugLicenseNumber: 'G-25/1048/BIO',
  incorporationYear: 2008,
  annualRevenueInrCr: 480.0,
  currency: 'INR',
  creditRating: 'AAA',
  solvencyRatio: 2.85,
  whoGmpCertified: true,
  fdaApproved: true,
  scheduleMCompliant: true,
  whoTrs1025Compliant: true,
  coldChainCapable: true,
  auditRiskLevel: 'LOW',
  otifRatePercent: 98.4,
  pillars: {
    financialScore: 95,
    marketPowerScore: 88,
    operationalScore: 96,
    complianceScore: 98,
    governanceScore: 92,
  },
  riskTrend: [
    { quarter: 'Q1 2025', risk_score: 38, audited_cases: 1 },
    { quarter: 'Q2 2025', risk_score: 32, audited_cases: 2 },
    { quarter: 'Q3 2025', risk_score: 28, audited_cases: 1 },
    { quarter: 'Q4 2025', risk_score: 22, audited_cases: 3 },
    { quarter: 'Q1 2026', risk_score: 18, audited_cases: 4 },
  ],
  products: [
    {
      productId: 'PRD-001',
      productName: 'Trastuzumab 440mg Lyophilized Injection',
      dosageForm: 'Single Dose Vial',
      strength: '440mg',
      packSize: '1 Vial + 20ml SWFI',
      quotedUnitPrice: 22800000.0,
      regulatedCeilingPrice: 24900000.0,
      isDpcoCompliant: true,
      coldChainRequired: true,
    },
    {
      productId: 'PRD-002',
      productName: 'Rituximab 500mg Concentrate Solution',
      dosageForm: 'Infusion Vial',
      strength: '500mg/50ml',
      packSize: '1 Vial',
      quotedUnitPrice: 18500000.0,
      regulatedCeilingPrice: 19800000.0,
      isDpcoCompliant: true,
      coldChainRequired: true,
    },
    {
      productId: 'PRD-003',
      productName: 'Enoxaparin Sodium 40mg Prefilled Syringe',
      dosageForm: 'PFS Injection',
      strength: '40mg / 0.4ml',
      packSize: 'Box of 2 PFS',
      quotedUnitPrice: 420.0,
      regulatedCeilingPrice: 480.0,
      isDpcoCompliant: true,
      coldChainRequired: false,
    },
  ],
  linkedCases: [
    {
      procurementId: 'case-2026-001',
      dealSize: 45600000.0,
      stage: 'COMPLETE',
      overallRisk: 'LOW',
      createdAt: '2026-03-12T10:30:00Z',
    },
    {
      procurementId: 'case-2025-089',
      dealSize: 22800000.0,
      stage: 'COMPLETE',
      overallRisk: 'LOW',
      createdAt: '2025-11-20T14:15:00Z',
    },
  ],
};

export const fetchVendorDirectory = async (params?: {
  query?: string;
  riskLevel?: string;
  coldChainOnly?: boolean;
}): Promise<VendorDirectoryResponse> => {
  try {
    const q = new URLSearchParams();
    if (params?.query) q.append('query', params.query);
    if (params?.riskLevel) q.append('risk_level', params.riskLevel);
    if (params?.coldChainOnly) q.append('cold_chain_only', 'true');

    const url = `/vendors${q.toString() ? `?${q.toString()}` : ''}`;
    return await httpClient.get<VendorDirectoryResponse>(url);
  } catch (err) {
    console.warn('API fetchVendorDirectory failed, using mock data:', err);
    let filtered = [...MOCK_DIRECTORY_RESPONSE.vendors];
    if (params?.query) {
      const qLower = params.query.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.vendorName.toLowerCase().includes(qLower) ||
          v.state.toLowerCase().includes(qLower) ||
          v.city.toLowerCase().includes(qLower)
      );
    }
    if (params?.riskLevel) {
      filtered = filtered.filter((v) => v.auditRiskLevel === params.riskLevel);
    }
    if (params?.coldChainOnly) {
      filtered = filtered.filter((v) => v.coldChainCapable);
    }
    return {
      total: filtered.length,
      currency: 'INR',
      vendors: filtered,
    };
  }
};

export const fetchVendor360Profile = async (
  vendorIdentifier: string
): Promise<Vendor360Response> => {
  try {
    return await httpClient.get<Vendor360Response>(
      `/vendors/${vendorIdentifier}/profile`
    );
  } catch (err) {
    console.warn('API fetchVendor360Profile failed, using mock data:', err);
    return {
      ...MOCK_360_RESPONSE,
      vendorId: vendorIdentifier,
      vendorName:
        vendorIdentifier === 'VND-001'
          ? 'Apex Pharma Chem Solutions'
          : MOCK_360_RESPONSE.vendorName,
    };
  }
};
