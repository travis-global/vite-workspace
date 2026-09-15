// src/context/NotificationContext.jsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/endpoints/notifications';
import { connectNotificationsSocket } from '../api/notificationsSocket';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        listNotifications({ limit: 50 }),
        getUnreadCount(),
      ]);
      setItems(listRes.data || []);
      setUnreadCount(countRes.data?.count ?? 0);
    } catch {
      /* stay on last known state */
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load when logged in
  useEffect(() => {
    if (!user) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    refresh();
  }, [user, refresh]);

  // Live socket while logged in
  useEffect(() => {
    if (!user) return undefined;

    const disconnect = connectNotificationsSocket((data) => {
      if (data.event === 'new_notification' && data.notification) {
        setItems((prev) => {
          const id = data.notification.notification_id;
          if (prev.some((n) => n.notification_id === id)) return prev;
          return [data.notification, ...prev];
        });
        setUnreadCount((c) => c + 1);
      }
      if (data.event === 'unread_count' && typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    });

    return disconnect;
  }, [user]);

  const markRead = useCallback(async (notificationId) => {
    await markNotificationRead(notificationId);
    setItems((prev) =>
      prev.map((n) =>
        n.notification_id === notificationId
          ? { ...n, is_read: 1, read_at: new Date().toISOString() }
          : n
      )
    );
    // Server also pushes unread_count; optimistically dip
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setItems((prev) =>
      prev.map((n) => ({ ...n, is_read: 1, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      refresh,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, loading, refresh, markRead, markAllRead]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
