import React, { useState, useMemo } from 'react';
import { ScrollText, Search, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import type { RequestLog } from '../types.ts';

interface RequestLogsProps {
  logs: RequestLog[];
}

export const RequestLogs: React.FC<RequestLogsProps> = ({ logs }) => {
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const methods = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesMethod =
        methodFilter === 'ALL' || log.method.toUpperCase() === methodFilter;
      const matchesSearch =
        searchTerm.trim() === '' ||
        log.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(log.status).includes(searchTerm);
      return matchesMethod && matchesSearch;
    });
  }, [logs, methodFilter, searchTerm]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top action bar */}
      <div className="h-14 border-b border-border-hairline flex items-center justify-between px-6 bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-text-primary tracking-tight">
            Live Request Logs
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-subtle border border-border-hairline text-text-secondary">
            {logs.length} / 100 ring buffer
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Method filter pills */}
          <div className="flex items-center gap-1 bg-surface-subtle border border-border-hairline p-0.5 rounded text-[11px] font-mono">
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  methodFilter === m
                    ? 'bg-surface-active text-text-primary font-medium border border-border-hairline'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Filter by path or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-52 h-8 pl-8 pr-3 bg-surface-subtle border border-border-hairline focus:border-border-focus rounded text-xs font-mono text-text-primary placeholder:text-text-muted outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Logs container */}
      <div className="flex-1 overflow-auto p-6">
        {filteredLogs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border-hairline rounded-lg text-center p-6 bg-surface/30">
            <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-text-muted mb-3 border border-border-hairline">
              <ScrollText className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">
              {logs.length === 0 ? 'No requests recorded yet' : 'No matching logs'}
            </p>
            <p className="text-xs text-text-muted max-w-sm">
              {logs.length === 0
                ? 'Send HTTP requests to your mock endpoints (e.g. via fetch or curl) to see them appear live.'
                : 'Try clearing your search query or switching method filters.'}
            </p>
          </div>
        ) : (
          <div className="border border-border-hairline rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-hairline bg-surface-subtle font-mono text-text-muted uppercase text-[10px] tracking-wider select-none">
                    <th className="px-4 py-2.5 font-medium w-24">Method</th>
                    <th className="px-4 py-2.5 font-medium">Path</th>
                    <th className="px-4 py-2.5 font-medium w-24">Status</th>
                    <th className="px-4 py-2.5 font-medium w-24 text-right">Duration</th>
                    <th className="px-4 py-2.5 font-medium w-36 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-hairline/60 font-mono">
                  {filteredLogs.map((log) => {
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-surface-hover/60 transition-colors"
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {renderMethodBadge(log.method)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-text-primary font-mono">
                          {log.path}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {renderStatusBadge(log.status)}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap text-text-secondary">
                          {log.duration}ms
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap text-text-muted text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function renderMethodBadge(method: string): React.ReactNode {
  const m = method.toUpperCase();
  const styles: Record<string, string> = {
    GET: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
    POST: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
    PUT: 'bg-blue-950/40 text-blue-300 border-blue-800/40',
    PATCH: 'bg-purple-950/40 text-purple-300 border-purple-800/40',
    DELETE: 'bg-red-950/40 text-red-300 border-red-800/40',
  };

  const style =
    styles[m] || 'bg-surface-subtle text-text-secondary border-border-hairline';

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${style}`}
    >
      {m}
    </span>
  );
}

function renderStatusBadge(status: number): React.ReactNode {
  let style = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
  if (status >= 500) {
    style = 'bg-red-950/40 text-red-300 border-red-800/40';
  } else if (status >= 400) {
    style = 'bg-amber-950/40 text-amber-300 border-amber-800/40';
  } else if (status >= 300) {
    style = 'bg-cyan-950/40 text-cyan-300 border-cyan-800/40';
  }

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${style}`}
    >
      {status}
    </span>
  );
}
