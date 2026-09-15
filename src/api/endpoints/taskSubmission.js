// src/api/endpoints/taskSubmission.js
// Backend: features/task_submission/routes.py

import client from '../client';

export function listMyTasks() {
  return client.get('/tasks/mine');
}

export function getMyTask(taskId) {
  return client.get('/tasks/mine/' + taskId);
}

export function submitTask(taskId, { note, fileId, file } = {}) {
  const form = new FormData();
  if (note) form.append('note', note);
  if (fileId) form.append('file_id', fileId);
  if (file) form.append('file', file);

  return client.post('/tasks/mine/' + taskId + '/submit', form);
}
