import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchStudioState,
  updateStudioConfig,
  resetDatabase,
  createRecord,
  updateRecord,
  deleteRecord,
  createResource,
  deleteResource,
} from './api.ts';
import type { StudioState, RecordItem } from './types.ts';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ResourceTable } from './components/ResourceTable.tsx';
import { RequestLogs } from './components/RequestLogs.tsx';
import { RecordModal } from './components/RecordModal.tsx';
import { CreateResourceModal } from './components/CreateResourceModal.tsx';
import { ConfirmModal } from './components/ConfirmModal.tsx';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [state, setState] = useState<StudioState | null>(null);
  const [currentView, setCurrentView] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isCreateResourceModalOpen, setIsCreateResourceModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecordItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [deletingResourceName, setDeletingResourceName] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null,
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Refresh data from server
  const refreshData = useCallback(async (isInitial = false) => {
    try {
      const data = await fetchStudioState();
      setState(data);
      if (isInitial && data.resourceNames.length > 0) {
        setCurrentView((prev) => prev || data.resourceNames[0]);
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshData(true);
  }, [refreshData]);

  // Periodic polling every 1.5 seconds for live logs and mutations
  useEffect(() => {
    const timer = setInterval(() => {
      refreshData(false);
    }, 1500);
    return () => clearInterval(timer);
  }, [refreshData]);

  // Update latency / chaos settings
  const handleUpdateSettings = async (patch: { delay?: number; errorRate?: number }) => {
    try {
      const res = await updateStudioConfig(patch);
      if (state) {
        setState({ ...state, settings: res.settings });
      }
      showToast('Settings updated');
    } catch (err) {
      showToast((err as Error).message, 'error');
    }
  };

  // Reset database to seed
  const handleConfirmReset = async () => {
    try {
      setIsResetting(true);
      await resetDatabase();
      await refreshData(false);
      showToast('Database reset to original seed data');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Create Resource
  const handleCreateResource = async (name: string, seed?: Record<string, unknown>[]) => {
    await createResource(name, seed);
    await refreshData(false);
    setCurrentView(name);
    showToast(`Resource /${name} created`);
  };

  // Delete Resource
  const handleConfirmDeleteResource = async () => {
    if (!deletingResourceName) return;
    try {
      await deleteResource(deletingResourceName);
      await refreshData(false);
      if (currentView === deletingResourceName) {
        const remaining = (state?.resourceNames || []).filter(
          (r) => r !== deletingResourceName,
        );
        setCurrentView(remaining.length > 0 ? remaining[0] : '__logs__');
      }
      showToast(`Resource /${deletingResourceName} deleted`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setDeletingResourceName(null);
    }
  };

  // Create or Update Record
  const handleSaveRecord = async (recordPayload: Record<string, unknown>) => {
    if (!currentView || currentView === '__logs__') return;

    if (editingRecord && editingRecord.id !== undefined) {
      // Update
      await updateRecord(currentView, editingRecord.id, recordPayload);
      showToast(`Record #${editingRecord.id} updated`);
    } else {
      // Create
      const created = await createRecord(currentView, recordPayload);
      showToast(`Record #${created.id ?? ''} created`);
    }
    await refreshData(false);
  };

  // Delete Record
  const handleConfirmDelete = async () => {
    if (deletingId === null || !currentView || currentView === '__logs__') return;
    try {
      await deleteRecord(currentView, deletingId);
      showToast(`Record #${deletingId} deleted`);
      await refreshData(false);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-text-muted gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="font-mono text-xs">Loading MockIt Studio...</span>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md bg-surface border border-border-hairline p-8 rounded-xl space-y-4">
          <div className="text-red-400 font-mono text-sm">Failed to connect to MockIt Server</div>
          <p className="text-xs text-text-muted">{error}</p>
          <button
            onClick={() => refreshData(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!state) return null;

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        settings={state.settings}
        onUpdateSettings={handleUpdateSettings}
        onResetDatabase={() => setIsResetConfirmOpen(true)}
        isResetting={isResetting}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          resourceNames={state.resourceNames}
          resources={state.resources}
          currentView={currentView}
          onSelectView={setCurrentView}
          logsCount={state.logs.length}
          onOpenCreateResource={() => setIsCreateResourceModalOpen(true)}
          onDeleteResource={(name) => setDeletingResourceName(name)}
        />

        {/* Content View */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          {currentView === '__logs__' ? (
            <RequestLogs logs={state.logs} />
          ) : (
            <ResourceTable
              resourceName={currentView}
              records={state.resources[currentView] || []}
              onAddRecord={() => {
                setEditingRecord(null);
                setIsRecordModalOpen(true);
              }}
              onEditRecord={(record) => {
                setEditingRecord(record);
                setIsRecordModalOpen(true);
              }}
              onDeleteRecord={(id) => {
                setDeletingId(id);
              }}
            />
          )}
        </main>
      </div>

      {/* Create Resource Modal */}
      <CreateResourceModal
        isOpen={isCreateResourceModalOpen}
        onClose={() => setIsCreateResourceModalOpen(false)}
        onCreate={handleCreateResource}
      />

      {/* Create / Edit Record Modal */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSave={handleSaveRecord}
        initialRecord={editingRecord}
        resourceName={currentView}
      />

      {/* Confirm Delete Record Modal */}
      <ConfirmModal
        isOpen={deletingId !== null}
        title="Delete Record"
        message={`Are you sure you want to delete this record from /${currentView}? This change will persist to .mockdb.json.`}
        confirmLabel="Delete"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeletingId(null)}
      />

      {/* Confirm Delete Resource Modal */}
      <ConfirmModal
        isOpen={deletingResourceName !== null}
        title="Delete Resource Collection"
        message={`Are you sure you want to delete the entire /${deletingResourceName} collection? All records in this resource will be permanently removed.`}
        confirmLabel="Delete Collection"
        isDestructive={true}
        onConfirm={handleConfirmDeleteResource}
        onClose={() => setDeletingResourceName(null)}
      />

      {/* Confirm Reset Database Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Reset Mock Database"
        message="This will delete .mockdb.json and reload all mock collections from the initial seed definitions in your config. This action cannot be undone."
        confirmLabel="Reset Database"
        isDestructive={true}
        onConfirm={handleConfirmReset}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface border border-border-hairline shadow-lg font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === 'error' ? 'bg-red-400' : 'bg-emerald-400'
            }`}
          />
          <span className="text-text-primary">{toast.message}</span>
        </div>
      )}
    </div>
  );
};
