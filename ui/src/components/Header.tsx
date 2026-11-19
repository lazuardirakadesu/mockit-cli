import React, { useState, useEffect } from 'react';
import { Activity, RotateCcw, Zap, AlertTriangle } from 'lucide-react';
import type { ServerSettings } from '../types.ts';

interface HeaderProps {
  settings: ServerSettings;
  onUpdateSettings: (patch: { delay?: number; errorRate?: number }) => Promise<void>;
  onResetDatabase: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onResetDatabase,
  isResetting,
}) => {
  const [delay, setDelay] = useState(settings.delay);
  const [errorRate, setErrorRate] = useState(settings.errorRate);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setDelay(settings.delay);
  }, [settings.delay]);

  useEffect(() => {
    setErrorRate(settings.errorRate);
  }, [settings.errorRate]);

  const handleDelayChange = async (val: number) => {
    setDelay(val);
    try {
      setIsUpdating(true);
      await onUpdateSettings({ delay: val });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleErrorRateChange = async (val: number) => {
    setErrorRate(val);
    try {
      setIsUpdating(true);
      await onUpdateSettings({ errorRate: val });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <header className="h-14 border-b border-border-hairline bg-surface flex items-center justify-between px-6 select-none shrink-0">
      {/* Left: Server Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-subtle border border-border-hairline text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-text-primary font-medium">Live</span>
          <span className="text-text-muted">:{settings.port}</span>
        </div>
        {isUpdating && (
          <span className="text-xs text-text-muted animate-pulse font-mono">
            Syncing...
          </span>
        )}
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center gap-6">
        {/* Latency Simulation */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium">Latency:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={delay}
              onChange={(e) => handleDelayChange(Number(e.target.value))}
              className="w-24 h-1.5 bg-surface-hover rounded-lg appearance-none cursor-pointer"
            />
            <span className="font-mono text-text-primary min-w-[50px] text-right px-1.5 py-0.5 rounded bg-surface-subtle border border-border-hairline">
              {delay}ms
            </span>
          </div>
        </div>

        {/* Chaos Error Rate */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">Chaos:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={errorRate}
              onChange={(e) => handleErrorRateChange(Number(e.target.value))}
              className="w-20 h-1.5 bg-surface-hover rounded-lg appearance-none cursor-pointer"
            />
            <span
              className={`font-mono min-w-[42px] text-right px-1.5 py-0.5 rounded border border-border-hairline ${
                errorRate > 0
                  ? 'bg-amber-950/30 text-amber-300 border-amber-800/40'
                  : 'bg-surface-subtle text-text-primary'
              }`}
            >
              {errorRate}%
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-border-hairline" />

        {/* Reset Database Button */}
        <button
          onClick={onResetDatabase}
          disabled={isResetting}
          title="Reset database to initial seed data"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded bg-surface-subtle hover:bg-surface-hover border border-border-hairline text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset DB</span>
        </button>
      </div>
    </header>
  );
};
