// src/api/endpoints/notifications.js
// Backend: features/notification_system/routes.py

import client from '../client';

export function listNotifications({ unreadOnly = false, limit = 50 } = {}) {
  return client.get('/notifications', {
    params: {
      unread_only: unreadOnly || undefined,
      limit: limit,
    },
  });
}

export function getUnreadCount() {
  return client.get('/notifications/unread-count');
}

export function markNotificationRead(notificationId) {
  return client.post('/notifications/' + notificationId + '/read');
}

export function markAllNotificationsRead() {
  return client.post('/notifications/read-all');
}
