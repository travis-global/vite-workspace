// src/pages/general/StaffDirectory.jsx

import { useEffect, useMemo, useState } from 'react';
import { listStaffDirectory } from '../../api/endpoints/directory';
import styles from './StaffDirectory.module.css';

export default function StaffDirectory() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listStaffDirectory()
      .then((res) => setRows(res.data || []))
      .catch((err) =>
        setError(err.response?.data?.detail || 'Failed to load directory.')
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((u) => {
      const roles = (u.roles || [])
        .map((r) => r.role_name || r)
        .join(' ')
        .toLowerCase();
      return (
        (u.full_name || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.user_id || '').toLowerCase().includes(term) ||
        (u.phone || '').toLowerCase().includes(term) ||
        roles.includes(term)
      );
    });
  }, [rows, q]);

  const copyId = async (userId) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Fallback for older WebViews
      const el = document.createElement('textarea');
      el.value = userId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Staff Directory</h1>
        <p className={styles.subtitle}>
          Find any colleague and copy their <strong>user_id</strong> for tasks,
          meetings, salary, queries, and chat.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.card}>
        <input
          className={styles.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, user_id, role…"
        />

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p className={styles.muted}>No matches.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>user_id</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Roles</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.user_id}>
                    <td>{u.full_name}</td>
                    <td className={styles.mono}>{u.user_id}</td>
                    <td>{u.email || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      {(u.roles || [])
                        .map((r) => r.role_name || r)
                        .join(', ') || '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={() => copyId(u.user_id)}
                      >
                        {copiedId === u.user_id ? 'Copied' : 'Copy ID'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
