import { HealthApiResponse } from '../types/health';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface HealthCheckResult {
  data: HealthApiResponse | null;
  latencyMs: number;
  error: string | null;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async checkHealth(): Promise<HealthCheckResult> {
    const startTime = performance.now();
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const latencyMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        return {
          data: null,
          latencyMs,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const json = (await response.json()) as HealthApiResponse;
      return {
        data: json,
        latencyMs,
        error: null,
      };
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to backend';
      return {
        data: null,
        latencyMs,
        error: errorMessage,
      };
    }
  }
}

export const apiClient = new ApiClient();
