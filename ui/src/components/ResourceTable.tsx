import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, Database, AlertCircle } from 'lucide-react';
import type { RecordItem } from '../types.ts';

interface ResourceTableProps {
  resourceName: string;
  records: RecordItem[];
  onAddRecord: () => void;
  onEditRecord: (record: RecordItem) => void;
  onDeleteRecord: (id: string | number) => void;
}

export const ResourceTable: React.FC<ResourceTableProps> = ({
  resourceName,
  records,
  onAddRecord,
  onEditRecord,
  onDeleteRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Extract all unique columns across records, keeping 'id' first
  const columns = useMemo(() => {
    const colSet = new Set<string>();
    for (const r of records) {
      for (const k of Object.keys(r)) {
        if (k !== 'id') colSet.add(k);
      }
    }
    const cols = Array.from(colSet);
    return ['id', ...cols];
  }, [records]);

  // Client-side quick filter
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();
    return records.filter((r) =>
      Object.values(r).some((val) =>
        String(val ?? '').toLowerCase().includes(term),
      ),
    );
  }, [records, searchTerm]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top action bar */}
      <div className="h-14 border-b border-border-hairline flex items-center justify-between px-6 bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-text-primary tracking-tight">
            /{resourceName}
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-subtle border border-border-hairline text-text-secondary">
            {records.length} records
          </span>
          <span className="text-xs text-text-muted font-mono">
            GET /api/{resourceName}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Filter records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 h-8 pl-8 pr-3 bg-surface-subtle border border-border-hairline focus:border-border-focus rounded text-xs font-mono text-text-primary placeholder:text-text-muted outline-none transition-colors"
            />
          </div>

          {/* Add Record Button */}
          <button
            onClick={onAddRecord}
            className="flex items-center gap-1.5 h-8 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm shadow-indigo-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-auto p-6">
        {filteredRecords.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-border-hairline rounded-lg text-center p-6 bg-surface/30">
            <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-text-muted mb-3 border border-border-hairline">
              <Database className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">
              {searchTerm ? 'No matching records' : 'No records yet'}
            </p>
            <p className="text-xs text-text-muted max-w-sm mb-4">
              {searchTerm
                ? 'Try adjusting your search filter or clear the query.'
                : `Create your first mock record in /api/${resourceName}.`}
            </p>
            {!searchTerm && (
              <button
                onClick={onAddRecord}
                className="flex items-center gap-1.5 h-8 px-3 rounded bg-surface-hover border border-border-hairline text-text-primary text-xs font-medium hover:border-border-focus transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            )}
          </div>
        ) : (
          <div className="border border-border-hairline rounded-lg overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-hairline bg-surface-subtle font-mono text-text-muted uppercase text-[10px] tracking-wider select-none">
                    {columns.map((col) => (
                      <th key={col} className="px-4 py-2.5 font-medium">
                        {col}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-hairline/60 font-mono">
                  {filteredRecords.map((record, index) => {
                    const id = record.id ?? index;
                    return (
                      <tr
                        key={String(id)}
                        className="hover:bg-surface-hover/60 transition-colors group"
                      >
                        {columns.map((col) => {
                          const val = record[col];
                          return (
                            <td
                              key={col}
                              className="px-4 py-2.5 whitespace-nowrap text-text-secondary"
                            >
                              {renderCellValue(col, val)}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditRecord(record)}
                              title="Edit record"
                              className="p-1 rounded hover:bg-surface-active text-text-muted hover:text-text-primary transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (record.id !== undefined) {
                                  onDeleteRecord(record.id);
                                }
                              }}
                              title="Delete record"
                              className="p-1 rounded hover:bg-red-950/30 text-text-muted hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

function renderCellValue(key: string, value: unknown): React.ReactNode {
  if (value === undefined || value === null) {
    return <span className="text-text-muted/60 italic">null</span>;
  }

  if (key === 'id') {
    return <span className="text-indigo-400 font-semibold">{String(value)}</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
          value
            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
            : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/40'
        }`}
      >
        {value ? 'true' : 'false'}
      </span>
    );
  }

  if (typeof value === 'number') {
    return <span className="text-amber-300">{value}</span>;
  }

  if (typeof value === 'object') {
    const jsonStr = JSON.stringify(value);
    return (
      <span className="text-text-muted truncate max-w-xs block" title={jsonStr}>
        {jsonStr}
      </span>
    );
  }

  return <span className="text-text-primary">{String(value)}</span>;
}
