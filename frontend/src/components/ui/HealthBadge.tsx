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
        className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors text-slate-700 dark:text-slate-300 cursor-pointer"
        title="System API & Database Connectivity"
      >
        <span className="relative flex h-2 w-2">
          {loading ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
          ) : isHealthy ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
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
          <div className="absolute bottom-full mb-2 left-0 w-72 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-modal z-50 text-xs">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                Backend Status
              </span>
              <button
                onClick={performCheck}
                disabled={loading}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                title="Refresh health check"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">API Endpoint:</span>
                <span className="font-mono text-[11px] truncate max-w-[140px] text-slate-700 dark:text-slate-300">
                  {apiClient.getBaseUrl()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">Status:</span>
                <span className="font-mono font-medium flex items-center gap-1">
                  {isHealthy ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> UP
                    </span>
                  ) : isDegraded ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> DEGRADED
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> DOWN
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">Latency:</span>
                <span className="font-mono">{result?.latencyMs ?? 0} ms</span>
              </div>

              {result?.data?.data && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Version:</span>
                    <span className="font-mono">{result.data.data.version}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Environment:</span>
                    <span className="font-mono uppercase">{result.data.data.environment}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Database className="w-3 h-3" /> PostgreSQL:
                    </span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      {result.data.data.services.database?.status ?? 'N/A'}
                    </span>
                  </div>
                </>
              )}

              {isError && (
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-800 dark:text-rose-300 text-[11px]">
                  <p className="font-medium">Connectivity Notice</p>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 truncate">{result?.error}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
