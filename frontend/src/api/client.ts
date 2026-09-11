import { ProcurementAPI, mockProcurementAPI, httpProcurementAPI } from './procurement';
import { ApprovalAPI, mockApprovalAPI, httpApprovalAPI } from './approval';
import { httpClient } from './httpClient';
import { ApiError, normalizeError, isApiError } from './errors';

const useMock = import.meta.env.VITE_USE_MOCK_API !== 'false';

export const procurementApi: ProcurementAPI = useMock ? mockProcurementAPI : httpProcurementAPI;
export const approvalApi: ApprovalAPI = useMock ? mockApprovalAPI : httpApprovalAPI;

export const isMockMode = useMock;

export { httpClient, ApiError, normalizeError, isApiError };
