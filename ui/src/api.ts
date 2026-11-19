import type { StudioState, RecordItem, ServerSettings } from './types.ts';

export async function fetchStudioState(): Promise<StudioState> {
  const res = await fetch('/_api/studio/state');
  if (!res.ok) {
    throw new Error(`Failed to fetch studio state: ${res.statusText}`);
  }
  return res.json();
}

export async function updateStudioConfig(patch: {
  delay?: number;
  errorRate?: number;
}): Promise<{ success: boolean; settings: ServerSettings }> {
  const res = await fetch('/_api/studio/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update config');
  }
  return res.json();
}

export async function resetDatabase(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/_api/studio/reset', {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error('Failed to reset database');
  }
  return res.json();
}

export async function createRecord(
  resource: string,
  record: Record<string, unknown>,
): Promise<RecordItem> {
  const res = await fetch(`/api/${resource}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to create record');
  }
  return res.json();
}

export async function updateRecord(
  resource: string,
  id: string | number,
  record: Record<string, unknown>,
): Promise<RecordItem> {
  const res = await fetch(`/api/${resource}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'Failed to update record');
  }
  return res.json();
}

export async function deleteRecord(
  resource: string,
  id: string | number,
): Promise<RecordItem> {
  const res = await fetch(`/api/${resource}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete record');
  }
  return res.json();
}
