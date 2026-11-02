export interface DatabaseHealth {
  status: string;
  databaseProduct?: string;
  error?: string;
}

export interface HealthData {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  application: string;
  version: string;
  environment: string;
  timestamp: string;
  uptimeMs: number;
  services: {
    database?: DatabaseHealth;
    [key: string]: unknown;
  };
}

export interface HealthApiResponse {
  success: boolean;
  message: string;
  data: HealthData;
  timestamp: string;
}
