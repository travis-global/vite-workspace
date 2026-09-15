// src/pages/general/Staff.jsx

import { useEffect, useState } from 'react';
import {
  listStaff,
  updateStaff,
  deactivateStaff,
  getAttendanceSheet,
  clockIn,
  clockOut,
  getMyAttendance,
} from '../../api/endpoints/staff';
import styles from './Staff.module.css';

export default function Staff() {
  const [rows, setRows] = useState([]);
  const [editDraft, setEditDraft] = useState({});
  const [sheet, setSheet] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, sheetRes, mineRes] = await Promise.all([
        listStaff(),
        getAttendanceSheet(),
        getMyAttendance(),
      ]);
      setRows(staffRes.data);
      setSheet(sheetRes.data);
      setMyAttendance(mineRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load staff.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (userId) => {
    const d = editDraft[userId] || {};
    try {
      await updateStaff(userId, {
        fullName: d.full_name,
        email: d.email,
        phone: d.phone,
      });
      setSuccessMsg('Profile updated.');
      setEditDraft((p) => {
        const n = { ...p };
        delete n[userId];
        return n;
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.');
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this staff member?')) return;
    try {
      await deactivateStaff(userId);
      setSuccessMsg('Staff deactivated.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Deactivate failed.');
    }
  };

  const handleClockIn = async () => {
    try {
      await clockIn();
      setSuccessMsg('Clocked in.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Clock-in failed.');
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut();
      setSuccessMsg('Clocked out.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Clock-out failed.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Staff Management</h1>
        <p className={styles.subtitle}>
          View and update staff profiles, deactivate accounts, and track attendance.
          Copy user_id values for task assignment and meetings.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>My attendance today</h2>
        <div className={styles.clockRow}>
          <button type="button" className={styles.primaryBtn} onClick={handleClockIn}>
            Clock in
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={handleClockOut}>
            Clock out
          </button>
        </div>
        {myAttendance.length === 0 ? (
          <p className={styles.muted}>No recent attendance records.</p>
        ) : (
          <ul className={styles.simpleList}>
            {myAttendance.slice(0, 5).map((r) => (
              <li key={r.attendance_id || r.date + r.user_id}>
                {r.date || r.attendance_date}: in {r.clock_in || '—'} · out{' '}
                {r.clock_out || '—'}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.card}>
        <h2>Staff</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No staff found.</p>
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
                {rows.map((row) => {
                  const id = row.user_id;
                  const draft = editDraft[id] || {};
                  return (
                    <tr key={id}>
                      <td>
                        <input
                          value={draft.full_name ?? row.full_name ?? ''}
                          onChange={(e) =>
                            setEditDraft((p) => ({
                              ...p,
                              [id]: { ...p[id], full_name: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className={styles.mono}>{id}</td>
                      <td>
                        <input
                          value={draft.email ?? row.email ?? ''}
                          onChange={(e) =>
                            setEditDraft((p) => ({
                              ...p,
                              [id]: { ...p[id], email: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={draft.phone ?? row.phone ?? ''}
                          onChange={(e) =>
                            setEditDraft((p) => ({
                              ...p,
                              [id]: { ...p[id], phone: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td>
                        {(row.roles || [])
                          .map((r) => r.role_name || r)
                          .join(', ') || '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => handleSave(id)}
                        >
                          Save
                        </button>
                        {' · '}
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => handleDeactivate(id)}
                        >
                          Deactivate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2>Attendance sheet</h2>
        {sheet.length === 0 ? (
          <p className={styles.muted}>No attendance records.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                </tr>
              </thead>
              <tbody>
                {sheet.map((r) => (
                  <tr key={(r.attendance_id || '') + (r.date || '') + r.user_id}>
                    <td>{r.full_name || r.user_id}</td>
                    <td>{r.date || r.attendance_date}</td>
                    <td>{r.clock_in_time || r.clock_in || '—'}</td>
                    <td>{r.clock_out_time || r.clock_out || '—'}</td>
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
