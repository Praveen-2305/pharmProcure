import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient } from '../src/api/httpClient';
import { ApiError, normalizeError, parseFastApiValidationErrors } from '../src/api/errors';

describe('HttpClient and ApiError Standard Design Suite', () => {
  let client: HttpClient;

  beforeEach(() => {
    client = new HttpClient({ baseURL: 'https://api.autonosource.internal', defaultTimeout: 1000 });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET and POST Requests', () => {
    it('successfully performs GET request and parses JSON', async () => {
      const mockData = { id: 'PR-100', status: 'COMPLETE' };
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const res = await client.get<typeof mockData>('/procurement/PR-100/status');
      expect(res).toEqual(mockData);
    });

    it('attaches query params correctly to URL', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await client.get('/procurement/all', {
        params: { limit: 10, search: 'Biotech', page: 1 },
      });

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://api.autonosource.internal/procurement/all?limit=10&search=Biotech&page=1'),
        expect.any(Object)
      );
    });

    it('correctly serializes JSON payload on POST', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const payload = { vendorName: 'Novis Biotech', dealSize: 500000 };
      await client.post('/procurement/submit', payload);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.autonosource.internal/procurement/submit',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        })
      );
    });

    it('omits Content-Type header when sending FormData to allow browser boundary calculation', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ id: '123' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const formData = new FormData();
      formData.append('vendorName', 'Acme Corp');

      await client.post('/procurement/submit', formData);

      expect(fetchSpy).toHaveBeenCalled();
      const calledHeaders = fetchSpy.mock.calls[0][1]?.headers as Headers;
      expect(calledHeaders.has('Content-Type')).toBe(false);
    });

    it('handles 204 No Content response properly', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(null, {
          status: 204,
        })
      );

      const res = await client.delete('/procurement/PR-999');
      expect(res).toBeUndefined();
    });
  });

  describe('Error Normalization & FastAPI 422 Handling', () => {
    it('normalizes FastAPI 422 validation errors with field error dictionary', async () => {
      const fastApi422Response = {
        detail: [
          { loc: ['body', 'vendorName'], msg: 'Vendor entity name is required', type: 'value_error' },
          { loc: ['body', 'dealSize'], msg: 'Deal size must be greater than 0', type: 'value_error' },
        ],
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(fastApi422Response), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      try {
        await client.post('/procurement/submit', {});
        expect.fail('Should have thrown ApiError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.status).toBe(422);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.validationErrors).toEqual({
          vendorName: 'Vendor entity name is required',
          dealSize: 'Deal size must be greater than 0',
        });
        expect(err.message).toContain('Vendor entity name is required');
      }
    });

    it('classifies 401 Unauthorized, 403 Forbidden, 404 Not Found, and 500 Internal Server Error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: 'Token expired' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(client.get('/secure/data')).rejects.toMatchObject({
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Token expired',
      });
    });

    it('handles network dropouts (fetch failed) cleanly', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));

      try {
        await client.get('/status');
        expect.fail('Should have thrown ApiError');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.code).toBe('NETWORK_ERROR');
        expect(err.isNetworkError).toBe(true);
      }
    });

    it('handles request timeouts gracefully', async () => {
      // Mock fetch hanging until signal abort
      vi.spyOn(globalThis, 'fetch').mockImplementationOnce((_url, options) => {
        return new Promise((_, reject) => {
          options?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Timeout occurred', 'TimeoutError'));
          });
        });
      });

      const fastClient = new HttpClient({
        baseURL: 'https://api.test',
        defaultTimeout: 50,
      });

      try {
        await fastClient.get('/long-polling');
        expect.fail('Should have timed out');
      } catch (err: any) {
        expect(err).toBeInstanceOf(ApiError);
        expect(err.isTimeout).toBe(true);
      }
    });
  });

  describe('Interceptors Pipeline', () => {
    it('executes request interceptor to inject authorization headers', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ authenticated: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      client.useRequestInterceptor((config, url) => {
        return {
          url,
          config: {
            ...config,
            headers: {
              ...config.headers,
              Authorization: 'Bearer test-jwt-token',
            },
          },
        };
      });

      await client.get('/user/me');

      expect(fetchSpy).toHaveBeenCalled();
      const calledHeaders = fetchSpy.mock.calls[0][1]?.headers as Headers;
      expect(calledHeaders.get('Authorization')).toBe('Bearer test-jwt-token');
    });

    it('executes response interceptor before resolving data', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ raw: 'data' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      let intercepted = false;
      client.useResponseInterceptor((response) => {
        intercepted = true;
        return response;
      });

      await client.get('/test');
      expect(intercepted).toBe(true);
    });
  });

  describe('Utility normalization tests', () => {
    it('parses string detail FastAPI responses', () => {
      const parsed = parseFastApiValidationErrors({ detail: 'Invalid parameters provided' });
      expect(parsed).toEqual({
        message: 'Invalid parameters provided',
        fieldErrors: { general: 'Invalid parameters provided' },
      });
    });

    it('normalizeError handles unknown types safely', () => {
      const normalized = normalizeError(null);
      expect(normalized).toBeInstanceOf(ApiError);
      expect(normalized.code).toBe('UNKNOWN_ERROR');
    });
  });
});
