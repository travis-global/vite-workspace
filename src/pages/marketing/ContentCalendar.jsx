// src/pages/marketing/ContentCalendar.jsx

import { useEffect, useState } from 'react';
import {
  listCalendarEntries,
  createCalendarEntry,
  updateEntryStatus,
  exportCsvUrl,
  exportPdfUrl,
} from '../../api/endpoints/contentCalendar';
import styles from './ContentCalendar.module.css';

const STATUSES = [
  'idea',
  'awaiting_approval',
  'approved',
  'posted',
  'rejected',
  'deleted',
];

const NEEDS_REASON = new Set(['rejected', 'deleted']);

const emptyForm = {
  calendarDate: new Date().toISOString().slice(0, 10),
  title: '',
  channel: '',
  postingTime: '',
};

export default function ContentCalendar() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    channel: '',
  });
  const [statusDraft, setStatusDraft] = useState({}); // entry_id -> { status, reason }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listCalendarEntries({
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        status: filters.status || undefined,
        channel: filters.channel || undefined,
      });
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await createCalendarEntry({
        calendarDate: form.calendarDate,
        title: form.title.trim(),
        channel: form.channel.trim(),
        postingTime: form.postingTime || undefined,
      });
      setForm(emptyForm);
      setSuccessMsg('Entry created.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (entryId) => {
    const draft = statusDraft[entryId] || {};
    const newStatus = draft.status;
    if (!newStatus) return;
    if (NEEDS_REASON.has(newStatus) && !draft.reason?.trim()) {
      setError(`A reason is required for status "${newStatus}".`);
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      await updateEntryStatus(entryId, {
        newStatus,
        reason: draft.reason?.trim() || undefined,
      });
      setSuccessMsg('Status updated.');
      setStatusDraft((prev) => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status.');
    }
  };

  const downloadWithAuth = (url, filename) => {
    const token = localStorage.getItem('workspace_token');
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => {
        if (!res.ok) throw new Error('Export failed');
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => setError('Export failed.'));
  };

  const statusClass = (status) => {
    if (status === 'posted' || status === 'approved') return styles.badgeOk;
    if (status === 'awaiting_approval' || status === 'idea') return styles.badgeWarn;
    if (status === 'rejected' || status === 'deleted') return styles.badgeBad;
    return styles.badgeMuted;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Content Calendar</h1>
        <p className={styles.subtitle}>
          Plan posts and move them through idea → approval → posted.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>New entry</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <label>
            Date
            <input
              name="calendarDate"
              type="date"
              value={form.calendarDate}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Channel
            <input
              name="channel"
              value={form.channel}
              onChange={handleForm}
              required
              placeholder="e.g. Instagram, LinkedIn"
            />
          </label>
          <label className={styles.full}>
            Title
            <input
              name="title"
              value={form.title}
              onChange={handleForm}
              required
              placeholder="Post title or topic"
            />
          </label>
          <label>
            Posting time <span className={styles.optional}>(optional)</span>
            <input
              name="postingTime"
              type="time"
              value={form.postingTime}
              onChange={handleForm}
            />
          </label>
          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Saving…' : 'Add entry'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Entries</h2>
          <div className={styles.exportBtns}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() =>
                downloadWithAuth(
                  exportCsvUrl(filters),
                  'content_calendar.csv'
                )
              }
            >
              CSV
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() =>
                downloadWithAuth(
                  exportPdfUrl(filters),
                  'content_calendar.pdf'
                )
              }
            >
              PDF
            </button>
          </div>
        </div>

        <div className={styles.filters}>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilter}
            placeholder="From"
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilter}
          />
          <select name="status" value={filters.status} onChange={handleFilter}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            name="channel"
            value={filters.channel}
            onChange={handleFilter}
            placeholder="Channel"
          />
          <button type="button" className={styles.primaryBtn} onClick={load}>
            Apply
          </button>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No entries.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Channel</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Change status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const id = row.entry_id || row.id;
                  const draft = statusDraft[id] || {};
                  return (
                    <tr key={id}>
                      <td>{row.calendar_date}</td>
                      <td>
                        {row.title}
                        <div className={styles.sub}>{row.content_id}</div>
                      </td>
                      <td>{row.channel}</td>
                      <td>{row.posting_time || '—'}</td>
                      <td>
                        <span className={statusClass(row.status)}>{row.status}</span>
                        {row.status_reason && (
                          <div className={styles.sub}>{row.status_reason}</div>
                        )}
                      </td>
                      <td>
                        <div className={styles.statusControls}>
                          <select
                            value={draft.status || ''}
                            onChange={(e) =>
                              setStatusDraft((prev) => ({
                                ...prev,
                                [id]: { ...prev[id], status: e.target.value },
                              }))
                            }
                          >
                            <option value="">—</option>
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          {NEEDS_REASON.has(draft.status) && (
                            <input
                              placeholder="Reason required"
                              value={draft.reason || ''}
                              onChange={(e) =>
                                setStatusDraft((prev) => ({
                                  ...prev,
                                  [id]: { ...prev[id], reason: e.target.value },
                                }))
                              }
                            />
                          )}
                          <button
                            type="button"
                            className={styles.linkBtn}
                            disabled={!draft.status}
                            onClick={() => handleStatusChange(id)}
                          >
                            Apply
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
