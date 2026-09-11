/**
 * Normalized API Error classification for standard HTTP and network exception handling.
 */

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface ValidationErrorDetail {
  loc?: (string | number)[];
  msg: string;
  type?: string;
  field?: string;
}

export class ApiError extends Error {
  public readonly status?: number;
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;
  public readonly validationErrors?: Record<string, string>;
  public readonly isTimeout: boolean;
  public readonly isNetworkError: boolean;
  public readonly isAborted: boolean;

  constructor(options: {
    message: string;
    status?: number;
    code?: ApiErrorCode;
    details?: unknown;
    validationErrors?: Record<string, string>;
    isTimeout?: boolean;
    isNetworkError?: boolean;
    isAborted?: boolean;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code ?? classifyStatusCode(options.status);
    this.details = options.details;
    this.validationErrors = options.validationErrors;
    this.isTimeout = Boolean(options.isTimeout || this.code === 'TIMEOUT');
    this.isNetworkError = Boolean(options.isNetworkError || this.code === 'NETWORK_ERROR');
    this.isAborted = Boolean(options.isAborted || this.code === 'ABORTED');

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function classifyStatusCode(status?: number): ApiErrorCode {
  if (!status) return 'UNKNOWN_ERROR';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 422) return 'VALIDATION_ERROR';
  if (status >= 400 && status < 500) return 'VALIDATION_ERROR';
  if (status >= 500) return 'SERVER_ERROR';
  return 'UNKNOWN_ERROR';
}

/**
 * Parses FastAPI validation errors (422 Unprocessable Entity)
 * Format: { detail: [ { loc: ["body", "fieldName"], msg: "Field required", type: "value_error" } ] }
 */
export function parseFastApiValidationErrors(
  details: unknown
): { message: string; fieldErrors: Record<string, string> } | null {
  if (!details || typeof details !== 'object') return null;

  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];

  const rawDetail = (details as { detail?: unknown }).detail;

  if (Array.isArray(rawDetail)) {
    for (const item of rawDetail) {
      if (item && typeof item === 'object') {
        const loc = Array.isArray(item.loc) ? item.loc : [];
        const fieldName = loc[loc.length - 1]?.toString() || 'general';
        const msg = item.msg || 'Invalid field value';
        fieldErrors[fieldName] = msg;
        messages.push(`${fieldName}: ${msg}`);
      }
    }
  } else if (typeof rawDetail === 'string') {
    return { message: rawDetail, fieldErrors: { general: rawDetail } };
  }

  if (messages.length > 0) {
    return {
      message: messages.join('; '),
      fieldErrors,
    };
  }

  return null;
}

/**
 * Normalizes any caught error into a structured, type-safe ApiError instance.
 */
export function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) {
    return err;
  }

  if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
    const isTimeout = err.name === 'TimeoutError';
    return new ApiError({
      message: isTimeout ? 'Request timed out. Please try again.' : 'Request was cancelled.',
      code: isTimeout ? 'TIMEOUT' : 'ABORTED',
      isTimeout,
      isAborted: !isTimeout,
    });
  }

  if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
    return new ApiError({
      message: 'Network connection error. Please verify your internet connection or server status.',
      code: 'NETWORK_ERROR',
      isNetworkError: true,
    });
  }

  if (err instanceof Error) {
    return new ApiError({
      message: err.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR',
      details: err,
    });
  }

  return new ApiError({
    message: typeof err === 'string' ? err : 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
    details: err,
  });
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
