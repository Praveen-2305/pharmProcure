import { httpClient } from './httpClient';
import {
  AlertsListResponse,
  RegulatoryAlert,
  SimulateEventRequest,
} from './types';

const MOCK_ALERTS_RESPONSE: AlertsListResponse = {
  total: 4,
  unacknowledgedCount: 3,
  alerts: [
    {
      alertId: 'ALT-2026-001',
      alertType: 'COLD_CHAIN_EXCURSION',
      vendorId: 'VND-001',
      vendorName: 'Apex BioLogistics Pvt. Ltd.',
      severity: 'CRITICAL',
      headline: 'IoT Logger Alert: 14.2°C Temperature Spike in Transit',
      description:
        'Real-time sensor telemetry from Consignment #TR-8820 registered an ambient excursion of 14.2°C for 52 consecutive minutes exceeding WHO TRS 1025 tolerance limits.',
      statuteReference: 'WHO Technical Report Series No. 1025 Annex 7 & Schedule M 2024',
      suggestedRemedy:
        'Hold consignment at receiving dock; quarantine batch pending stability testing before PO invoice authorization.',
      isAcknowledged: false,
      createdAt: new Date().toISOString(),
    },
    {
      alertId: 'ALT-2026-002',
      alertType: 'CDSCO_NSQ_ALERT',
      vendorId: 'VND-023',
      vendorName: 'DeshPharma Bulk Trading Co.',
      severity: 'HIGH',
      headline: 'CDSCO Monthly Drug Alert: Sub-Potency Impurity Notice',
      description:
        "State Drug Testing Laboratory marked Batch DP-904 as 'Not of Standard Quality' (NSQ) due to assay failure in dissolution rate tests.",
      statuteReference: 'Drugs and Cosmetics Act, 1940 Section 18(a)(i)',
      suggestedRemedy:
        'Halt all pending disbursements and require certificate of re-analysis from CDSCO accredited laboratory.',
      isAcknowledged: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      alertId: 'ALT-2026-003',
      alertType: 'PRICE_CEILING_REVISED',
      vendorId: 'VND-002',
      vendorName: 'Bharat Biotherapeutics Labs',
      severity: 'MEDIUM',
      headline: 'NPPA Statutory Notification: Trastuzumab Ceiling Lowered by 4.5%',
      description:
        'NPPA published Gazette S.O. 1142(E) revising statutory ceiling for Trastuzumab 440mg downwards to ₹23,780.00 effective immediately.',
      statuteReference: 'DPCO 2013 Paragraph 4 & Paragraph 11',
      suggestedRemedy:
        'Issue contract price adjustment addendum to align active purchase orders with newly notified ceiling rate.',
      isAcknowledged: false,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      alertId: 'ALT-2026-004',
      alertType: 'DEBARMENT_NOTICE',
      vendorId: 'VND-044',
      vendorName: 'Rhein-Main Sterile Injectables GmbH',
      severity: 'HIGH',
      headline: 'State Procurement Debarment Advisory Issued',
      description:
        'Maharashtra State Medical Supplies Corporation issued a 12-month tender participation suspension citing repeated delivery defaults.',
      statuteReference: 'Public Procurement (Preference to Make in India) Order 2017 & GFR Rule 151',
      suggestedRemedy:
        'Flag vendor in multi-vendor comparisons; require bank guarantee prior to contract award.',
      isAcknowledged: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

export const fetchAlerts = async (params?: {
  unacknowledgedOnly?: boolean;
  severity?: string;
}): Promise<AlertsListResponse> => {
  try {
    const q = new URLSearchParams();
    if (params?.unacknowledgedOnly) q.append('unacknowledged_only', 'true');
    if (params?.severity) q.append('severity', params.severity);

    const url = `/alerts${q.toString() ? `?${q.toString()}` : ''}`;
    return await httpClient.get<AlertsListResponse>(url);
  } catch (err) {
    console.warn('API fetchAlerts failed, using mock data:', err);
    let list = [...MOCK_ALERTS_RESPONSE.alerts];
    if (params?.unacknowledgedOnly) {
      list = list.filter((a) => !a.isAcknowledged);
    }
    if (params?.severity) {
      list = list.filter((a) => a.severity === params.severity);
    }
    return {
      total: list.length,
      unacknowledgedCount: list.filter((a) => !a.isAcknowledged).length,
      alerts: list,
    };
  }
};

export const acknowledgeAlert = async (alertId: string): Promise<RegulatoryAlert> => {
  try {
    return await httpClient.post<RegulatoryAlert>(`/alerts/${alertId}/ack`);
  } catch (err) {
    console.warn('API acknowledgeAlert failed, using mock data:', err);
    const found = MOCK_ALERTS_RESPONSE.alerts.find((a) => a.alertId === alertId);
    if (found) {
      found.isAcknowledged = true;
      return { ...found };
    }
    return {
      alertId,
      alertType: 'GENERIC',
      vendorName: 'Vendor',
      severity: 'LOW',
      headline: 'Alert Acknowledged',
      description: 'Marked acknowledged locally.',
      statuteReference: 'Compliance SOP',
      suggestedRemedy: 'Archived.',
      isAcknowledged: true,
      createdAt: new Date().toISOString(),
    };
  }
};

export const simulateRegulatoryEvent = async (
  req: SimulateEventRequest
): Promise<RegulatoryAlert> => {
  try {
    return await httpClient.post<RegulatoryAlert>('/admin/simulate-event', req);
  } catch (err) {
    console.warn('API simulateRegulatoryEvent failed, using mock data:', err);
    const newAlert: RegulatoryAlert = {
      alertId: `ALT-SIM-${Date.now()}`,
      alertType: req.alertType,
      vendorName: req.vendorName,
      severity: req.severity,
      headline: req.headline,
      description: req.description,
      statuteReference: req.statuteReference,
      suggestedRemedy: req.suggestedRemedy,
      isAcknowledged: false,
      createdAt: new Date().toISOString(),
    };
    MOCK_ALERTS_RESPONSE.alerts.unshift(newAlert);
    MOCK_ALERTS_RESPONSE.total += 1;
    MOCK_ALERTS_RESPONSE.unacknowledgedCount += 1;
    return newAlert;
  }
};
