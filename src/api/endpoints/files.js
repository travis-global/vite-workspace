// src/api/endpoints/files.js
// Backend: features/file_library_system/routes.py

import client from '../client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function listFiles({ category, department, storageTier } = {}) {
  return client.get('/files', {
    params: {
      category: category || undefined,
      department: department || undefined,
      storage_tier: storageTier || undefined,
    },
  });
}

export function getFile(fileId) {
  return client.get('/files/' + fileId);
}

export function uploadFile({ file, category, department, storageTier }) {
  const form = new FormData();
  form.append('file', file);
  if (category) form.append('category', category);
  if (department) form.append('department', department);
  if (storageTier) form.append('storage_tier', storageTier);

  // Let the browser set multipart boundary — do not set Content-Type manually
  return client.post('/files/upload', form);
}

export function deleteFile(fileId) {
  return client.delete('/files/' + fileId);
}

/** Authenticated download via blob */
export async function downloadFile(fileId, filename) {
  const token = localStorage.getItem('workspace_token');
  const res = await fetch(API_BASE + '/files/' + fileId + '/download', {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename || 'download';
  a.click();
  URL.revokeObjectURL(a.href);
}
