// src/pages/technical/StaffSecurity.jsx

import { useState } from 'react';
import {
  resetPassword,
  setAdminStatus,
} from '../../api/endpoints/staffSecurity';
import styles from './StaffSecurity.module.css';

export default function StaffSecurity() {
  const [resetUserId, setResetUserId] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [adminUserId, setAdminUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(true);
  const [adminReason, setAdminReason] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await resetPassword(resetUserId.trim(), resetReason.trim());
      setSuccessMsg(
        'Password reset. Temporary password was sent to that user’s Notifications — not shown here.'
      );
      setResetReason('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleAdmin = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await setAdminStatus(adminUserId.trim(), {
        isAdmin,
        reason: adminReason.trim(),
      });
      setSuccessMsg(
        'Admin status updated to: ' + (isAdmin ? 'admin' : 'not admin') + '.'
      );
      setAdminReason('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Admin update failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Staff Account Security</h1>
        <p className={styles.subtitle}>
          Sensitive actions require a written reason. Temporary passwords never appear in the API response.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>Reset password</h2>
        <form className={styles.form} onSubmit={handleReset}>
          <label>
            User id
            <input
              value={resetUserId}
              onChange={(e) => setResetUserId(e.target.value)}
              required
            />
          </label>
          <label className={styles.full}>
            Reason (required)
            <input
              value={resetReason}
              onChange={(e) => setResetReason(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={busy} className={styles.primaryBtn}>
            Reset password
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Set admin status</h2>
        <form className={styles.form} onSubmit={handleAdmin}>
          <label>
            User id
            <input
              value={adminUserId}
              onChange={(e) => setAdminUserId(e.target.value)}
              required
            />
          </label>
          <label>
            Admin?
            <select
              value={isAdmin ? 'true' : 'false'}
              onChange={(e) => setIsAdmin(e.target.value === 'true')}
            >
              <option value="true">Grant admin</option>
              <option value="false">Revoke admin</option>
            </select>
          </label>
          <label className={styles.full}>
            Reason (required)
            <input
              value={adminReason}
              onChange={(e) => setAdminReason(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={busy} className={styles.primaryBtn}>
            Update admin status
          </button>
        </form>
      </section>
    </div>
  );
}
