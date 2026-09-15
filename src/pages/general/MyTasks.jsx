// src/pages/general/MyTasks.jsx

import { useEffect, useState } from 'react';
import {
  listMyTasks,
  getMyTask,
  submitTask,
} from '../../api/endpoints/taskSubmission';
import styles from './MyTasks.module.css';

export default function MyTasks() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState('');
  const [fileId, setFileId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listMyTasks();
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openTask = async (taskId) => {
    setSelected(taskId);
    setDetail(null);
    setNote('');
    setFileId('');
    setFile(null);
    setDetailLoading(true);
    setError(null);
    try {
      const { data } = await getMyTask(taskId);
      setDetail(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load task.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!note.trim() && !fileId.trim() && !file) {
      setError('Provide a note, a file upload, or a File Library file_id.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await submitTask(selected, {
        note: note.trim() || undefined,
        fileId: fileId.trim() || undefined,
        file: file || undefined,
      });
      setSuccessMsg('Submitted.');
      setNote('');
      setFileId('');
      setFile(null);
      await openTask(selected);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>My Tasks</h1>
        <p className={styles.subtitle}>
          Tasks assigned to you. Submit a note, attach a file, or both.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>Assigned to me</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No tasks assigned to you.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.task_id}>
                    <td>{row.title}</td>
                    <td>{row.priority}</td>
                    <td>{row.due_date || '—'}</td>
                    <td>
                      <span className={styles.badge}>{row.status}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => openTask(row.task_id)}
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

      {selected && (
        <section className={styles.card}>
          <h2>
            {detail?.title || selected}
          </h2>
          {detailLoading ? (
            <p className={styles.muted}>Loading…</p>
          ) : detail ? (
            <>
              {detail.description && (
                <p className={styles.desc}>{detail.description}</p>
              )}
              <p className={styles.meta}>
                Priority: {detail.priority}
                {detail.due_date ? ' · Due: ' + detail.due_date : ''}
                {' · '}
                Status: {detail.status}
              </p>

              <h3 className={styles.subhead}>Submit work</h3>
              <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.full}>
                  Note <span className={styles.optional}>(optional if file provided)</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="What did you complete?"
                  />
                </label>
                <label>
                  Upload file <span className={styles.optional}>(optional)</span>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <label>
                  Or File Library file_id <span className={styles.optional}>(optional)</span>
                  <input
                    value={fileId}
                    onChange={(e) => setFileId(e.target.value)}
                    placeholder="file_id"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.primaryBtn}
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </form>

              <h3 className={styles.subhead}>Your submissions on this task</h3>
              {(detail.submissions || []).length === 0 ? (
                <p className={styles.muted}>None yet.</p>
              ) : (
                <ul className={styles.subList}>
                  {detail.submissions.map((s) => (
                    <li key={s.submission_id}>
                      <strong>#{s.submission_id}</strong>
                      {s.note ? ' — ' + s.note : ''}
                      {s.status ? ' · ' + s.status : ''}
                      {s.file_id ? ' · file: ' + s.file_id : ''}
                      {s.temp_original_filename
                        ? ' · upload: ' + s.temp_original_filename
                        : ''}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}
