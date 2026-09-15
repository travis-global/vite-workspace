// src/pages/general/TaskAssignment.jsx

import { useEffect, useState } from 'react';
import {
  listTasksIAssigned,
  createTask,
  cancelTask,
  listSubmissions,
  approveSubmission,
  rejectSubmission,
} from '../../api/endpoints/taskAssignment';
import styles from './TaskAssignment.module.css';

const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

const emptyForm = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'normal',
  assigneeIds: '',
};

export default function TaskAssignment() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listTasksIAssigned();
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

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const assigneeIds = form.assigneeIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (assigneeIds.length === 0) {
      setError('Add at least one assignee user_id (comma-separated).');
      setSubmitting(false);
      return;
    }

    try {
      await createTask({
        title: form.title.trim(),
        assigneeIds,
        description: form.description.trim() || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
      });
      setForm(emptyForm);
      setSuccessMsg('Task assigned.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (taskId) => {
    if (!window.confirm('Cancel this task?')) return;
    try {
      await cancelTask(taskId);
      setSuccessMsg('Task cancelled.');
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
        setSubmissions([]);
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Cancel failed.');
    }
  };

  const openSubmissions = async (taskId) => {
    setSelectedTaskId(taskId);
    setSubsLoading(true);
    setError(null);
    try {
      const { data } = await listSubmissions(taskId);
      setSubmissions(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load submissions.');
      setSubmissions([]);
    } finally {
      setSubsLoading(false);
    }
  };

  const handleApprove = async (submissionId) => {
    try {
      await approveSubmission(submissionId, {
        reviewNote: reviewNotes[submissionId] || undefined,
      });
      setSuccessMsg('Submission approved.');
      await openSubmissions(selectedTaskId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Approve failed.');
    }
  };

  const handleReject = async (submissionId) => {
    const note = (reviewNotes[submissionId] || '').trim();
    if (!note) {
      setError('A review note is required to reject.');
      return;
    }
    try {
      await rejectSubmission(submissionId, note);
      setSuccessMsg('Submission rejected.');
      await openSubmissions(selectedTaskId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Reject failed.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Task Assignment</h1>
        <p className={styles.subtitle}>
          Assign work to staff, then approve or reject their submissions.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>Assign a task</h2>
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
          <label className={styles.full}>
            Description <span className={styles.optional}>(optional)</span>
            <input
              name="description"
              value={form.description}
              onChange={handleForm}
            />
          </label>
          <label className={styles.full}>
            Assignee user ids (comma-separated)
            <input
              name="assigneeIds"
              value={form.assigneeIds}
              onChange={handleForm}
              required
              placeholder="user_id1, user_id2"
            />
          </label>
          <label>
            Due date <span className={styles.optional}>(optional)</span>
            <input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleForm}
            />
          </label>
          <label>
            Priority
            <select
              name="priority"
              value={form.priority}
              onChange={handleForm}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Assigning…' : 'Assign task'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Tasks I assigned</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No tasks yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Assignees</th>
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
                    <td className={styles.mono}>
                      {(row.assignees || []).join(', ') || '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => openSubmissions(row.task_id)}
                      >
                        Submissions
                      </button>
                      {row.status !== 'cancelled' && (
                        <>
                          {' · '}
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => handleCancel(row.task_id)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedTaskId && (
        <section className={styles.card}>
          <h2>Submissions — {selectedTaskId}</h2>
          {subsLoading ? (
            <p className={styles.muted}>Loading…</p>
          ) : submissions.length === 0 ? (
            <p className={styles.muted}>No submissions yet.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>By</th>
                    <th>Note</th>
                    <th>Status</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.submission_id}>
                      <td className={styles.mono}>{sub.submitted_by}</td>
                      <td>{sub.note || '—'}</td>
                      <td>{sub.status || 'pending'}</td>
                      <td>
                        <div className={styles.reviewRow}>
                          <input
                            placeholder="Review note (required to reject)"
                            value={reviewNotes[sub.submission_id] || ''}
                            onChange={(e) =>
                              setReviewNotes((p) => ({
                                ...p,
                                [sub.submission_id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => handleApprove(sub.submission_id)}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => handleReject(sub.submission_id)}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
