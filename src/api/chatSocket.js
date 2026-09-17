// src/api/chatSocket.js
// Backend: features/general_chat_system → /chat/ws?token=
//
// Use VITE_WS_BASE_URL (e.g. wss://ws.receipta.com.ng), not Vercel /backend.

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
 * Chat live socket.
 * onEvent(data) gets { event: 'new_message', message: {...} }
 * Returns cleanup() to close + stop reconnect.
 */
export function connectChatSocket(onEvent) {
  const token = localStorage.getItem('workspace_token');
  if (!token) return () => {};

  let ws = null;
  let closedByUs = false;
  let retryMs = 1000;
  let retryTimer = null;

  const connect = () => {
    const url =
      getWsBase() +
      '/chat/ws?token=' +
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
        /* ignore */
      }
    };

    ws.onclose = () => {
      if (closedByUs) return;
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
