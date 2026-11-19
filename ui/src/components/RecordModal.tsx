import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Code } from 'lucide-react';
import type { RecordItem } from '../types.ts';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Record<string, unknown>) => Promise<void>;
  initialRecord?: RecordItem | null;
  resourceName: string;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  resourceName,
}) => {
  const isEditing = !!initialRecord;
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialRecord) {
        // Exclude ID from editable body if desired or keep it
        setJsonText(JSON.stringify(initialRecord, null, 2));
      } else {
        // Sensible template for new record
        setJsonText('{\n  "name": "Sample item"\n}');
      }
    }
  }, [isOpen, initialRecord]);

  if (!isOpen) return null;

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError(`Invalid JSON syntax: ${(err as Error).message}`);
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError('Record payload must be a JSON object ({ ... })');
        return;
      }
      setIsSaving(true);
      await onSave(parsed);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-surface border border-border-hairline rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-14 border-b border-border-hairline flex items-center justify-between px-6 bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <Code className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-text-primary">
              {isEditing ? `Edit Record in /${resourceName}` : `Add Record to /${resourceName}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Payload (JSON):</span>
            <button
              type="button"
              onClick={handleFormat}
              className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] hover:underline"
            >
              Format JSON
            </button>
          </div>

          <div className="relative">
            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                if (error) setError(null);
              }}
              rows={10}
              spellCheck={false}
              className="w-full p-3 font-mono text-xs bg-background border border-border-hairline focus:border-border-focus rounded-lg text-text-primary outline-none transition-colors leading-relaxed selection:bg-indigo-600/30"
              placeholder='{\n  "title": "Example"\n}'
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 border-t border-border-hairline px-6 flex items-center justify-end gap-3 bg-surface-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-8 px-4 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 h-8 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm shadow-indigo-600/30 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : isEditing ? 'Update Record' : 'Create Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
