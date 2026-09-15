// src/pages/general/WorkerQueries.jsx

import { useEffect, useState } from 'react';
import {
  listMyQueries,
  listIssuedQueries,
  getQuery,
  issueQuery,
  respondToQuery,
  closeQuery,
} from '../../api/endpoints/workerQueries';
import styles from './WorkerQueries.module.css';

const OUTCOMES = ['no_action', 'warning', 'escalated', 'other'];

const emptyForm = {
  issuedTo: '',
  subject: '',
  body: '',
  responseDeadline: '',
};

export default function WorkerQueries() {
  const [tab, setTab] = useState('mine'); // mine | issued
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [outcome, setOutcome] = useState('no_action');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } =
        tab === 'mine' ? await listMyQueries() : await listIssuedQueries();
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load queries.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const openDetail = async (queryId) => {
    setSelectedId(queryId);
    setDetail(null);
    setResponseText('');
    setOutcome('no_action');
    setOutcomeNote('');
    try {
      const { data } = await getQuery(queryId);
      setDetail(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to open query.');
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await issueQuery({
        issuedTo: form.issuedTo.trim(),
        subject: form.subject.trim(),
        body: form.body.trim(),
        responseDeadline: form.responseDeadline || undefined,
      });
      setForm(emptyForm);
      setSuccessMsg('Query issued.');
      setTab('issued');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to issue query.');
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await respondToQuery(selectedId, responseText.trim());
      setSuccessMsg('Response submitted.');
      await openDetail(selectedId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Respond failed.');
    }
  };

  const handleClose = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    try {
      await closeQuery(selectedId, {
        outcome,
        outcomeNote: outcomeNote.trim() || undefined,
      });
      setSuccessMsg('Query closed.');
      await openDetail(selectedId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Close failed.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Worker Query</h1>
        <p className={styles.subtitle}>
          Formal workplace queries. Notifications stay generic; full text only here for parties involved.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>Issue a query</h2>
        <form className={styles.form} onSubmit={handleIssue}>
          <label>
            Issued to (user_id)
            <input
              value={form.issuedTo}
              onChange={(e) => setForm((p) => ({ ...p, issuedTo: e.target.value }))}
              required
            />
          </label>
          <label>
            Deadline <span className={styles.optional}>(optional)</span>
            <input
              type="date"
              value={form.responseDeadline}
              onChange={(e) =>
                setForm((p) => ({ ...p, responseDeadline: e.target.value }))
              }
            />
          </label>
          <label className={styles.full}>
            Subject
            <input
              value={form.subject}
              onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              required
            />
          </label>
          <label className={styles.full}>
            Body
            <textarea
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={4}
              required
            />
          </label>
          <button type="submit" className={styles.primaryBtn}>
            Issue query
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={tab === 'mine' ? styles.tabActive : styles.tab}
            onClick={() => setTab('mine')}
          >
            To me
          </button>
          <button
            type="button"
            className={tab === 'issued' ? styles.tabActive : styles.tab}
            onClick={() => setTab('issued')}
          >
            I issued
          </button>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>None.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.query_id}>
                    <td>{row.subject}</td>
                    <td>{row.status}</td>
                    <td>{row.response_deadline || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => openDetail(row.query_id)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detail && (
        <section className={styles.card}>
          <h2>{detail.subject}</h2>
          <p className={styles.meta}>
            Status: {detail.status}
            {detail.response_deadline
              ? ' · Deadline: ' + detail.response_deadline
              : ''}
          </p>
          <div className={styles.bodyBox}>{detail.body}</div>

          {detail.response_text && (
            <>
              <h3 className={styles.subhead}>Response</h3>
              <div className={styles.bodyBox}>{detail.response_text}</div>
            </>
          )}

          {detail.outcome && (
            <p className={styles.meta}>
              Outcome: {detail.outcome}
              {detail.outcome_note ? ' — ' + detail.outcome_note : ''}
            </p>
          )}

          {detail.status === 'pending_response' && tab === 'mine' && (
            <form className={styles.form} onSubmit={handleRespond}>
              <label className={styles.full}>
                Your response
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={3}
                  required
                />
              </label>
              <button type="submit" className={styles.primaryBtn}>
                Submit response
              </button>
            </form>
          )}

          {detail.status !== 'closed' && tab === 'issued' && (
            <form className={styles.form} onSubmit={handleClose}>
              <label>
                Outcome
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                >
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.full}>
                Outcome note <span className={styles.optional}>(optional)</span>
                <input
                  value={outcomeNote}
                  onChange={(e) => setOutcomeNote(e.target.value)}
                />
              </label>
              <button type="submit" className={styles.primaryBtn}>
                Close query
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
