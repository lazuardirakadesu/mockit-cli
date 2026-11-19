import React from 'react';
import { Database, ListFilter, ScrollText, Layers, Plus, Trash2 } from 'lucide-react';
import type { RecordItem } from '../types.ts';

interface SidebarProps {
  resourceNames: string[];
  resources: Record<string, RecordItem[]>;
  currentView: string; // resource name or '__logs__'
  onSelectView: (view: string) => void;
  logsCount: number;
  onOpenCreateResource: () => void;
  onDeleteResource: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  resourceNames,
  resources,
  currentView,
  onSelectView,
  logsCount,
  onOpenCreateResource,
  onDeleteResource,
}) => {
  return (
    <aside className="w-64 border-r border-border-hairline bg-surface flex flex-col justify-between shrink-0 select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-14 border-b border-border-hairline flex items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-indigo-500/20">
              ⚡
            </div>
            <span className="font-semibold text-sm tracking-tight text-text-primary">
              MockIt Studio
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-subtle border border-border-hairline text-indigo-400">
            v2.0.0
          </span>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-6 overflow-y-auto">
          {/* Resources Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-[11px] font-mono uppercase tracking-wider text-text-muted">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5" />
                <span>Mock Resources</span>
              </div>
              <button
                type="button"
                onClick={onOpenCreateResource}
                title="Add new mock resource collection"
                className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-indigo-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {resourceNames.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-muted italic flex items-center justify-between">
                  <span>No resources defined</span>
                  <button
                    onClick={onOpenCreateResource}
                    className="text-indigo-400 hover:underline text-xs"
                  >
                    + Create
                  </button>
                </div>
              ) : (
                resourceNames.map((name) => {
                  const count = resources[name]?.length ?? 0;
                  const isActive = currentView === name;
                  return (
                    <div
                      key={name}
                      onClick={() => onSelectView(name)}
                      className={`group w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors text-left cursor-pointer ${
                        isActive
                          ? 'bg-surface-active text-text-primary font-medium border border-border-hairline'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Layers
                          className={`w-3.5 h-3.5 ${
                            isActive ? 'text-indigo-400' : 'text-text-muted'
                          }`}
                        />
                        <span className="truncate">/{name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.2 rounded ${
                            isActive
                              ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-800/30'
                              : 'bg-surface-subtle text-text-muted border border-border-subtle'
                          }`}
                        >
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteResource(name);
                          }}
                          title={`Delete collection /${name}`}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-950/30 text-text-muted hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Monitoring Section */}
          <div>
            <div className="flex items-center gap-2 px-2 mb-2 text-[11px] font-mono uppercase tracking-wider text-text-muted">
              <ListFilter className="w-3.5 h-3.5" />
              <span>Monitoring</span>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => onSelectView('__logs__')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs transition-colors text-left ${
                  currentView === '__logs__'
                    ? 'bg-surface-active text-text-primary font-medium border border-border-hairline'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ScrollText
                    className={`w-3.5 h-3.5 ${
                      currentView === '__logs__'
                        ? 'text-indigo-400'
                        : 'text-text-muted'
                    }`}
                  />
                  <span>Request Logs</span>
                </div>
                {logsCount > 0 && (
                  <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-surface-subtle text-text-muted border border-border-subtle">
                    {logsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-border-hairline text-[11px] text-text-muted flex items-center justify-between">
        <span>Stateful Local DB</span>
        <span className="font-mono text-[10px] text-text-secondary">.mockdb.json</span>
      </div>
    </aside>
  );
};
