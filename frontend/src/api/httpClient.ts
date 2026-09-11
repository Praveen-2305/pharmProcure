import { ApiError, normalizeError, parseFastApiValidationErrors } from './errors';

export interface RequestConfig extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  timeout?: number;
}

export type RequestInterceptor = (
  config: RequestConfig,
  url: string
) => { config: RequestConfig; url: string } | Promise<{ config: RequestConfig; url: string }>;

export type ResponseInterceptor = (
  response: Response,
  config: RequestConfig
) => Response | Promise<Response>;

export type ErrorInterceptor = (
  error: ApiError,
  config: RequestConfig
) => unknown | Promise<unknown>;

export interface HttpClientOptions {
  baseURL?: string;
  defaultTimeout?: number;
  defaultHeaders?: Record<string, string>;
}

export class HttpClient {
  private readonly baseURL: string;
  private readonly defaultTimeout: number;
  private readonly defaultHeaders: Record<string, string>;

  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];
  private readonly errorInterceptors: ErrorInterceptor[] = [];

  constructor(options: HttpClientOptions = {}) {
    this.baseURL = (options.baseURL ?? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')).replace(/\/+$/, '');
    this.defaultTimeout = options.defaultTimeout ?? 15000;
    this.defaultHeaders = {
      Accept: 'application/json',
      ...options.defaultHeaders,
    };
  }

  public useRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      const idx = this.requestInterceptors.indexOf(interceptor);
      if (idx !== -1) this.requestInterceptors.splice(idx, 1);
    };
  }

  public useResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      const idx = this.responseInterceptors.indexOf(interceptor);
      if (idx !== -1) this.responseInterceptors.splice(idx, 1);
    };
  }

  public useErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor);
    return () => {
      const idx = this.errorInterceptors.indexOf(interceptor);
      if (idx !== -1) this.errorInterceptors.splice(idx, 1);
    };
  }

  public async request<T>(endpoint: string, options: RequestConfig = {}): Promise<T> {
    let currentUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://')
      ? endpoint
      : `${this.baseURL}/${endpoint.replace(/^\/+/, '')}`;

    let currentConfig: RequestConfig = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
    };

    // Apply URL search parameters if supplied
    if (currentConfig.params) {
      const urlObj = new URL(currentUrl);
      Object.entries(currentConfig.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlObj.searchParams.append(key, String(value));
        }
      });
      currentUrl = urlObj.toString();
    }

    // Execute request interceptors pipeline
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(currentConfig, currentUrl);
      currentConfig = result.config;
      currentUrl = result.url;
    }

    // Prepare Body and Content-Type
    const headers = new Headers(currentConfig.headers);
    let bodyPayload: BodyInit | undefined = undefined;

    if (currentConfig.body !== undefined && currentConfig.body !== null) {
      if (currentConfig.body instanceof FormData || currentConfig.body instanceof Blob || currentConfig.body instanceof ArrayBuffer) {
        // Let the browser automatically set the correct Content-Type (with boundary)
        headers.delete('Content-Type');
        bodyPayload = currentConfig.body as BodyInit;
      } else if (typeof currentConfig.body === 'string') {
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'text/plain;charset=UTF-8');
        }
        bodyPayload = currentConfig.body;
      } else {
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
        bodyPayload = JSON.stringify(currentConfig.body);
      }
    }

    // Setup Timeout and Abort Signals
    const timeoutMs = currentConfig.timeout ?? this.defaultTimeout;
    const controller = new AbortController();
    let isTimeoutTriggered = false;

    const timeoutId = setTimeout(() => {
      isTimeoutTriggered = true;
      controller.abort();
    }, timeoutMs);

    // Merge external signal if passed
    if (currentConfig.signal) {
      if (currentConfig.signal.aborted) {
        clearTimeout(timeoutId);
        throw normalizeError(new DOMException('Request was aborted', 'AbortError'));
      }
      currentConfig.signal.addEventListener('abort', () => {
        controller.abort();
      });
    }

    try {
      let response = await fetch(currentUrl, {
        ...currentConfig,
        headers,
        body: bodyPayload,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Run response interceptors pipeline
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response, currentConfig);
      }

      // Handle HTTP error statuses
      if (!response.ok) {
        let errorPayload: unknown = null;
        const contentType = response.headers.get('content-type') || '';

        try {
          if (contentType.includes('application/json')) {
            errorPayload = await response.json();
          } else {
            errorPayload = await response.text();
          }
        } catch {
          errorPayload = null;
        }

        // Check for FastAPI 422 validation structure
        let errorMessage = `Request failed with status ${response.status}: ${response.statusText}`;
        let validationErrors: Record<string, string> | undefined = undefined;

        if (response.status === 422 && errorPayload) {
          const parsed = parseFastApiValidationErrors(errorPayload);
          if (parsed) {
            errorMessage = `Validation error: ${parsed.message}`;
            validationErrors = parsed.fieldErrors;
          }
        } else if (errorPayload && typeof errorPayload === 'object' && 'detail' in errorPayload) {
          const detail = (errorPayload as { detail: unknown }).detail;
          if (typeof detail === 'string') {
            errorMessage = detail;
          }
        } else if (typeof errorPayload === 'string' && errorPayload.trim()) {
          errorMessage = errorPayload;
        }

        throw new ApiError({
          message: errorMessage,
          status: response.status,
          details: errorPayload,
          validationErrors,
        });
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return (await response.text()) as unknown as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      let apiErr: ApiError;
      if (isTimeoutTriggered) {
        apiErr = new ApiError({
          message: `Request timed out after ${timeoutMs}ms`,
          code: 'TIMEOUT',
          isTimeout: true,
        });
      } else {
        apiErr = normalizeError(err);
      }

      // Run error interceptors
      for (const interceptor of this.errorInterceptors) {
        await interceptor(apiErr, currentConfig);
      }

      throw apiErr;
    }
  }

  public get<T>(endpoint: string, options: Omit<RequestConfig, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options: Omit<RequestConfig, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  public put<T>(endpoint: string, body?: unknown, options: Omit<RequestConfig, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  public patch<T>(endpoint: string, body?: unknown, options: Omit<RequestConfig, 'body' | 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  public delete<T>(endpoint: string, options: Omit<RequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();
