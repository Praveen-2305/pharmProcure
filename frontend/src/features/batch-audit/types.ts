export type DpcoStatus = 'EXCEEDS_CEILING' | 'WITHIN_CEILING' | 'NON_SCHEDULED';

export interface BatchLineItem {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  category: string;
  quantity: number;
  unit: string;
  quotedUnitPrice: number;
  ceilingUnitPrice: number | null;
  dpcoStatus: DpcoStatus;
  excessPerUnit: number;
  totalExcess: number;
  totalQuoted: number;
  statutoryReference: string;
}

export interface BatchAuditSummary {
  totalItems: number;
  totalQuotedAmount: number;
  totalCompliantAmount: number;
  totalOverchargeAmount: number;
  violatingItemsCount: number;
  compliantItemsCount: number;
  complianceRate: number;
}
