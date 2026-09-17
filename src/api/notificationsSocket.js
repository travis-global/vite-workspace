// src/api/notificationsSocket.js
// Backend: features/notification_system/routes.py → /notifications/ws

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function getWsBase() {
  const explicit = import.meta.env.VITE_WS_BASE_URL;
  if (explicit && String(explicit).trim()) {
    return String(explicit).trim().replace(/\/$/, '');
  }
  return API_BASE.replace(/\/backend\/?$/, '')
    .replace(/^http/, 'ws')
    .replace(/\/$/, '');
}
/**
 * Open a notifications WebSocket for the current user.
 * onEvent(data) receives parsed JSON: { event, notification? } | { event, count? }
 * Returns a cleanup function that closes the socket and stops reconnects.
 */
export function connectNotificationsSocket(onEvent) {
  const token = localStorage.getItem('workspace_token');
  if (!token) return () => {};

  let ws = null;
  let closedByUs = false;
  let retryMs = 1000;
  let retryTimer = null;

  const connect = () => {
    const url =
  getWsBase() +
  '/notifications/ws?token=' +
  encodeURIComponent(token);
    
    ws = new WebSocket(url);

    ws.onopen = () => {
      retryMs = 1000;
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data && data.event) onEvent(data);
      } catch {
        /* ignore non-JSON */
      }
    };

    ws.onclose = () => {
      if (closedByUs) return;
      // Reconnect with backoff (max 30s)
      retryTimer = setTimeout(() => {
        retryMs = Math.min(retryMs * 2, 30000);
        connect();
      }, retryMs);
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    };
  };

  connect();

  return () => {
    closedByUs = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (ws && ws.readyState <= 1) ws.close();
  };
}
