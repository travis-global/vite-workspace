// src/pages/customer_rep/CspManagement.jsx

import { useEffect, useState } from 'react';
import {
  getTeamStatus,
  reassignTicket,
} from '../../api/endpoints/cspManagement';
import styles from './CspManagement.module.css';

export default function CspManagement() {
  const [team, setTeam] = useState([]);
  const [ticketId, setTicketId] = useState('');
  const [newCspId, setNewCspId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getTeamStatus();
      setTeam(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load team status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReassign = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    if (!reason.trim()) {
      setError('Reason is required.');
      return;
    }
    try {
      await reassignTicket(ticketId.trim(), {
        newCspId: newCspId.trim(),
        reason: reason.trim(),
      });
      setSuccessMsg('Ticket reassigned.');
      setTicketId('');
      setNewCspId('');
      setReason('');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Reassign failed.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Customer Rep Management</h1>
        <p className={styles.subtitle}>
          Team status and supervisor reassignment (reason required).
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Team status</h2>
          <button type="button" className={styles.secondaryBtn} onClick={load}>
            Refresh
          </button>
        </div>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : team.length === 0 ? (
          <p className={styles.muted}>
            No CSPs found (no users with customer_rep_chat_system).
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>user_id</th>
                  <th>Online</th>
                  <th>Available</th>
                  <th>Current ticket</th>
                  <th>Total</th>
                  <th>Closed today</th>
                  <th>Avg min</th>
                </tr>
              </thead>
              <tbody>
                {team.map((row) => (
                  <tr key={row.user_id}>
                    <td>{row.full_name}</td>
                    <td className={styles.mono}>{row.user_id}</td>
                    <td>{row.online ? 'yes' : 'no'}</td>
                    <td>{row.available ? 'yes' : 'no'}</td>
                    <td className={styles.mono}>
                      {row.current_ticket_id || '—'}
                    </td>
                    <td>{row.total_tickets}</td>
                    <td>{row.closed_today}</td>
                    <td>
                      {row.avg_resolution_minutes != null
                        ? Number(row.avg_resolution_minutes).toFixed(1)
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2>Force-reassign ticket</h2>
        <form className={styles.form} onSubmit={handleReassign}>
          <label>
            Ticket id
            <input
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              required
            />
          </label>
          <label>
            New CSP user_id
            <input
              value={newCspId}
              onChange={(e) => setNewCspId(e.target.value)}
              required
            />
          </label>
          <label className={styles.full}>
            Reason (required)
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </label>
          <button type="submit" className={styles.primaryBtn}>
            Reassign
          </button>
        </form>
      </section>
    </div>
  );
}
