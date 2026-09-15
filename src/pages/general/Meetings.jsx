// src/pages/general/Meetings.jsx

import { useEffect, useState } from 'react';
import {
  listMyMeetings,
  createMeeting,
  cancelMeeting,
  rescheduleMeeting,
} from '../../api/endpoints/meetings';
import styles from './Meetings.module.css';

const emptyForm = {
  title: '',
  startTime: '',
  endTime: '',
  description: '',
  isGeneral: true,
  attendeeIds: '',
};

export default function Meetings() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [rescheduleDraft, setRescheduleDraft] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listMyMeetings();
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleForm = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const attendeeIds = form.isGeneral
      ? undefined
      : form.attendeeIds
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    if (!form.isGeneral && (!attendeeIds || attendeeIds.length === 0)) {
      setError('Add at least one attendee user_id (comma-separated), or mark as company-wide.');
      setSubmitting(false);
      return;
    }

    try {
      const { data } = await createMeeting({
        title: form.title.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        description: form.description.trim() || undefined,
        isGeneral: form.isGeneral,
        attendeeIds,
      });
      setForm(emptyForm);
      setSuccessMsg(
        'Meeting created' +
          (data.meet_link ? ' — Meet: ' + data.meet_link : '') +
          '.'
      );
      await load();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to create meeting (Google Calendar may be required).'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (meetingId) => {
    if (!window.confirm('Cancel this meeting?')) return;
    try {
      await cancelMeeting(meetingId);
      setSuccessMsg('Meeting cancelled.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Cancel failed.');
    }
  };

  const handleReschedule = async (meetingId) => {
    const d = rescheduleDraft[meetingId] || {};
    if (!d.startTime || !d.endTime) {
      setError('Set both start and end for reschedule.');
      return;
    }
    try {
      await rescheduleMeeting(meetingId, {
        startTime: d.startTime,
        endTime: d.endTime,
      });
      setSuccessMsg('Meeting rescheduled.');
      setRescheduleDraft((p) => {
        const n = { ...p };
        delete n[meetingId];
        return n;
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Reschedule failed.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Meeting Scheduling</h1>
        <p className={styles.subtitle}>
          Schedule meetings with Google Meet links. Company-wide meetings notify everyone; specific ones need attendee user ids.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>New meeting</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <label className={styles.full}>
            Title
            <input
              name="title"
              value={form.title}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Start
            <input
              name="startTime"
              type="datetime-local"
              value={form.startTime}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            End
            <input
              name="endTime"
              type="datetime-local"
              value={form.endTime}
              onChange={handleForm}
              required
            />
          </label>
          <label className={styles.full}>
            Description <span className={styles.optional}>(optional)</span>
            <input
              name="description"
              value={form.description}
              onChange={handleForm}
            />
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              name="isGeneral"
              checked={form.isGeneral}
              onChange={handleForm}
            />
            Company-wide (no specific attendees)
          </label>
          {!form.isGeneral && (
            <label className={styles.full}>
              Attendee user ids (comma-separated)
              <input
                name="attendeeIds"
                value={form.attendeeIds}
                onChange={handleForm}
                placeholder="user_id1, user_id2"
              />
            </label>
          )}
          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Creating…' : 'Create meeting'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>My meetings</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No meetings.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>When</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Meet</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.meeting_id}>
                    <td>{row.title}</td>
                    <td>
                      {row.start_time}
                      <div className={styles.sub}>to {row.end_time}</div>
                    </td>
                    <td>{row.is_general ? 'Company-wide' : 'Specific'}</td>
                    <td>{row.status || 'scheduled'}</td>
                    <td>
                      {row.meet_link ? (
                        <a
                          href={row.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.linkBtn}
                        >
                          Join
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {row.status !== 'cancelled' && (
                        <div className={styles.actions}>
                          <input
                            type="datetime-local"
                            value={rescheduleDraft[row.meeting_id]?.startTime || ''}
                            onChange={(e) =>
                              setRescheduleDraft((p) => ({
                                ...p,
                                [row.meeting_id]: {
                                  ...p[row.meeting_id],
                                  startTime: e.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            type="datetime-local"
                            value={rescheduleDraft[row.meeting_id]?.endTime || ''}
                            onChange={(e) =>
                              setRescheduleDraft((p) => ({
                                ...p,
                                [row.meeting_id]: {
                                  ...p[row.meeting_id],
                                  endTime: e.target.value,
                                },
                              }))
                            }
                          />
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => handleReschedule(row.meeting_id)}
                          >
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => handleCancel(row.meeting_id)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
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
