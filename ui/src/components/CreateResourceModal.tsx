import React, { useState } from 'react';
import { X, Check, Database, AlertCircle, Sparkles } from 'lucide-react';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, seed?: Record<string, unknown>[]) => Promise<void>;
}

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [seedText, setSeedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTemplate = () => {
    setSeedText(
      JSON.stringify(
        [
          { name: 'Sample Item 1', status: 'active' },
          { name: 'Sample Item 2', status: 'pending' },
        ],
        null,
        2,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().toLowerCase();

    if (!cleanName) {
      setError('Resource name is required');
      return;
    }

    if (!/^[a-z0-9_-]+$/.test(cleanName)) {
      setError('Resource name can only contain lowercase letters, numbers, hyphens, and underscores');
      return;
    }

    let parsedSeed: Record<string, unknown>[] | undefined;
    if (seedText.trim()) {
      try {
        const parsed = JSON.parse(seedText);
        if (!Array.isArray(parsed)) {
          setError('Seed data must be a JSON array ([ { ... } ])');
          return;
        }
        parsedSeed = parsed;
      } catch (err) {
        setError(`Invalid JSON in seed records: ${(err as Error).message}`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onCreate(cleanName, parsedSeed);
      setName('');
      setSeedText('');
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-surface border border-border-hairline rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-14 border-b border-border-hairline flex items-center justify-between px-6 bg-surface-subtle">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-text-primary">
              Create Mock Resource
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Resource Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary">
              Resource Name
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-mono text-text-muted">
                /api/
              </span>
              <input
                type="text"
                autoFocus
                placeholder="orders, invoices, reviews"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full h-9 pl-14 pr-3 bg-background border border-border-hairline focus:border-border-focus rounded-lg text-xs font-mono text-text-primary outline-none transition-colors"
              />
            </div>
            <p className="text-[11px] text-text-muted">
              Auto-generates GET, POST, PUT, PATCH, DELETE under /api/{name || '<name>'}
            </p>
          </div>

          {/* Seed Data */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-text-secondary">
                Initial Seed Records (Optional)
              </label>
              <button
                type="button"
                onClick={handleTemplate}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-mono text-[11px] hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                <span>Insert Template</span>
              </button>
            </div>
            <textarea
              rows={6}
              spellCheck={false}
              placeholder='[\n  { "name": "Item 1", "price": 49.99 }\n]'
              value={seedText}
              onChange={(e) => {
                setSeedText(e.target.value);
                if (error) setError(null);
              }}
              className="w-full p-3 font-mono text-xs bg-background border border-border-hairline focus:border-border-focus rounded-lg text-text-primary outline-none transition-colors leading-relaxed selection:bg-indigo-600/30"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300 font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 px-4 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-1.5 h-8 px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors shadow-sm shadow-indigo-600/30 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Creating...' : 'Create Resource'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
