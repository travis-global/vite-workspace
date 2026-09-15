// src/api/endpoints/taskAssignment.js
// Backend: features/task_assignment_system/routes.py

import client from '../client';

export function listTasksIAssigned() {
  return client.get('/tasks/assignment');
}

export function createTask({
  title,
  assigneeIds,
  description,
  dueDate,
  priority = 'normal',
}) {
  return client.post('/tasks/assignment', assigneeIds, {
    params: {
      title: title,
      description: description || undefined,
      due_date: dueDate || undefined,
      priority: priority,
    },
  });
}

export function cancelTask(taskId) {
  return client.post('/tasks/assignment/' + taskId + '/cancel');
}

export function listSubmissions(taskId) {
  return client.get('/tasks/assignment/' + taskId + '/submissions');
}

export function approveSubmission(submissionId, { reviewNote } = {}) {
  return client.post(
    '/tasks/assignment/submissions/' + submissionId + '/approve',
    null,
    {
      params: {
        review_note: reviewNote || undefined,
      },
    }
  );
}

export function rejectSubmission(submissionId, reviewNote) {
  return client.post(
    '/tasks/assignment/submissions/' + submissionId + '/reject',
    null,
    {
      params: {
        review_note: reviewNote,
      },
    }
  );
}
