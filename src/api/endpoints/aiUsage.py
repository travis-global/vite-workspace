// src/api/endpoints/aiUsage.js
//
// Thin wrappers for AI usage analytics + alert thresholds + notifications.
// Backend: GET/PUT under /analytics/ai-usage* (Workspace proxy or bot analytics).

import client from '../client';

export function getAiUsage(period = 'today') {
  return client.get('/analytics/ai-usage', {
    params: { period },
  });
}

export function getAiUsageThresholds() {
  return client.get('/analytics/ai-usage/thresholds');
}

export function updateAiUsageThresholds(payload) {
  // payload: { max_calls_per_day, max_cost_usd_per_day, warn_at_pct, critical_at_pct, email_enabled }
  return client.put('/analytics/ai-usage/thresholds', payload);
}

export function listAiNotifications({ unreadOnly = false } = {}) {
  return client.get('/analytics/notifications', {
    params: { unread_only: unreadOnly },
  });
}

export function markAiNotificationRead(id) {
  return client.post(`/analytics/notifications/${id}/read`);
}

export function markAllAiNotificationsRead() {
  return client.post('/analytics/notifications/read-all');
}
