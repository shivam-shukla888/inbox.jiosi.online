import React, { useEffect, useState } from 'react';
import { apiClient, HealthCheckResult } from '../../api/client';
import { RefreshCw, Server, Database, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const HealthBadge: React.FC = () => {
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const performCheck = async () => {
    setLoading(true);
    const res = await apiClient.checkHealth();
    setResult(res);
    setLoading(false);
  };

  useEffect(() => {
    performCheck();
    // Poll every 30 seconds
    const interval = setInterval(performCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  const isHealthy = result?.data?.data?.status === 'UP';
  const isDegraded = result?.data?.data?.status === 'DEGRADED';
  const isError = !result?.data || !!result?.error;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono rounded border border-border-subtle bg-canvas-surface hover:bg-canvas-hover transition-colors text-ink-secondary"
        title="Click to view detailed system health"
      >
        <span className="relative flex h-2 w-2">
          {loading ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ink-subtle opacity-75"></span>
          ) : isHealthy ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          ) : isDegraded ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          )}
        </span>
        <span className="truncate">
          {loading
            ? 'Checking API...'
            : isHealthy
            ? `API: Healthy · ${result?.latencyMs}ms`
            : isDegraded
            ? 'API: Degraded'
            : 'API: Offline'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full mb-2 left-0 w-72 p-3 bg-white border border-border-strong rounded-lg shadow-command z-50 text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
              <span className="font-semibold text-ink-primary flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-ink-muted" />
                Backend Health Status
              </span>
              <button
                onClick={performCheck}
                disabled={loading}
                className="p-1 rounded hover:bg-canvas-surface text-ink-muted transition-colors disabled:opacity-50"
                title="Refresh health check"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">API Endpoint:</span>
                <span className="font-mono text-[11px] truncate max-w-[150px]">
                  {apiClient.getBaseUrl()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Overall Status:</span>
                <span className="font-mono font-medium flex items-center gap-1">
                  {isHealthy ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> UP
                    </span>
                  ) : isDegraded ? (
                    <span className="text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> DEGRADED
                    </span>
                  ) : (
                    <span className="text-rose-700 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> DOWN
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Response Latency:</span>
                <span className="font-mono">{result?.latencyMs ?? 0} ms</span>
              </div>

              {result?.data?.data && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">API Version:</span>
                    <span className="font-mono">{result.data.data.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Environment:</span>
                    <span className="font-mono uppercase">{result.data.data.environment}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
                    <span className="text-ink-muted flex items-center gap-1">
                      <Database className="w-3 h-3" /> PostgreSQL:
                    </span>
                    <span className="font-mono text-emerald-700 font-medium">
                      {result.data.data.services.database?.status ?? 'N/A'}
                    </span>
                  </div>
                </>
              )}

              {isError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                  <p className="font-medium">Connection Error</p>
                  <p className="text-[10px] text-rose-600 truncate">{result?.error}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
