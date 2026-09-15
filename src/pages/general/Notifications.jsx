// src/pages/general/Notifications.jsx

import { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import styles from './Notifications.module.css';

export default function Notifications() {
  const {
    items,
    unreadCount,
    loading,
    refresh,
    markRead,
    markAllRead,
  } = useNotifications();

  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState(null);

  const rows = unreadOnly
    ? items.filter((n) => {
        const read = n.is_read === 1 || n.is_read === true || n.read_at;
        return !read;
      })
    : items;

  const handleRead = async (id) => {
    setError(null);
    try {
      await markRead(id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not mark as read.');
    }
  };

  const handleReadAll = async () => {
    setError(null);
    try {
      await markAllRead();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not mark all as read.');
    }
  };

  const handleRefresh = async () => {
    setError(null);
    try {
      await refresh();
    } catch {
      setError('Refresh failed.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Notifications</h1>
        <p className={styles.subtitle}>
          Live updates while this app is open. Unread: <strong>{unreadCount}</strong>
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.toolbar}>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
        <button type="button" className={styles.secondaryBtn} onClick={handleReadAll}>
          Mark all read
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={handleRefresh}>
          Refresh
        </button>
      </div>

      <section className={styles.card}>
        {loading && items.length === 0 ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No notifications.</p>
        ) : (
          <ul className={styles.list}>
            {rows.map((n) => {
              const unread = !(
                n.is_read === 1 ||
                n.is_read === true ||
                n.read_at
              );
              return (
                <li
                  key={n.notification_id}
                  className={unread ? styles.itemUnread : styles.item}
                >
                  <div className={styles.itemHead}>
                    <strong>{n.title}</strong>
                    <span className={styles.time}>{n.created_at || ''}</span>
                  </div>
                  <p className={styles.body}>{n.body}</p>
                  <div className={styles.meta}>
                    {n.notif_type || n.type || 'info'}
                    {n.source_feature ? ' · ' + n.source_feature : ''}
                    {unread && (
                      <>
                        {' · '}
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => handleRead(n.notification_id)}
                        >
                          Mark read
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
