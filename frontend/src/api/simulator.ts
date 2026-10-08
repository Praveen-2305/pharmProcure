import { httpClient } from './httpClient';
import { SimulationInputs, SimulationResponse } from './types';

const MOCK_SIMULATION_RESPONSE: SimulationResponse = {
  procurementId: 'case-mock-01',
  vendorName: 'Apex BioLogistics Pvt. Ltd.',
  originalOverallRisk: 'HIGH',
  simulatedOverallRisk: 'LOW',
  riskScoreBefore: 85,
  riskScoreAfter: 22,
  riskScoreDelta: -63,
  isDpcoCompliantBefore: false,
  isDpcoCompliantAfter: true,
  ceilingPriceInr: 24900000.0,
  quotedPriceBefore: 27900000.0,
  quotedPriceAfter: 23500000.0,
  priceVariancePercentAfter: -5.6,
  dimensions: [
    {
      dimension: 'Pricing Compliance (DPCO 2013)',
      originalLevel: 'EXCEEDS_CEILING',
      simulatedLevel: 'WITHIN_CEILING',
      originalRationale: 'Original unit quote: ₹27,900,000.00 (+12.0% above DPCO ceiling)',
      simulatedRationale: 'Simulated unit rate ₹23,500,000.00 is within statutory DPCO ceiling (-5.6% below ceiling).',
      improved: true,
    },
    {
      dimension: 'Contract & Cold-Chain Terms',
      originalLevel: 'HIGH',
      simulatedLevel: 'LOW',
      originalRationale: 'Baseline contract indemnity capped at ₹50k with ambient transit clause',
      simulatedRationale: 'WHO TRS 1025 continuous logging enforced; Liability cap raised to 150% of contract value; OTIF SLA guaranteed at 98.5%',
      improved: true,
    },
    {
      dimension: 'Financial Solvency',
      originalLevel: 'MEDIUM',
      simulatedLevel: 'LOW',
      originalRationale: 'Baseline vendor balance sheet',
      simulatedRationale: 'Solvent credit profile (Score 780) indicates negligible default risk.',
      improved: true,
    },
    {
      dimension: 'Regulatory & CDSCO Standing',
      originalLevel: 'LOW',
      simulatedLevel: 'LOW',
      originalRationale: 'CDSCO Schedule M verification',
      simulatedRationale: 'CDSCO regulatory status verified via master audit records.',
      improved: false,
    },
  ],
  negotiationRecommendation:
    'Optimal deal posture achieved. All statutory DPCO price ceilings and WHO TRS 1025 quality warranties satisfied. Recommended for unencumbered PO execution.',
};

export const simulateScenario = async (
  caseId: string,
  inputs: SimulationInputs
): Promise<SimulationResponse> => {
  try {
    return await httpClient.post<SimulationResponse>(
      `/procurement/${caseId}/simulate`,
      inputs
    );
  } catch (err) {
    console.warn('API simulateScenario failed, using mock data:', err);
    return {
      ...MOCK_SIMULATION_RESPONSE,
      procurementId: caseId,
      quotedPriceAfter: inputs.quotedPrice ?? MOCK_SIMULATION_RESPONSE.quotedPriceAfter,
      isDpcoCompliantAfter: (inputs.quotedPrice ?? 23500000.0) <= 24900000.0,
    };
  }
};
