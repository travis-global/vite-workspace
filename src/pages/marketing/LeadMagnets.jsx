// src/pages/marketing/LeadMagnets.jsx

import { useEffect, useState } from 'react';
import {
  listLeadMagnets,
  createLeadMagnet,
  deleteLeadMagnet,
  getLeadMagnetPerformance,
} from '../../api/endpoints/leadMagnets';
import styles from './LeadMagnets.module.css';

const emptyForm = {
  title: '',
  fileId: '',
  description: '',
  landingCopy: '',
};

export default function LeadMagnets() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [perf, setPerf] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listLeadMagnets();
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load lead magnets.');
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
    try {
      await createLeadMagnet({
        title: form.title.trim(),
        fileId: form.fileId.trim(),
        description: form.description.trim() || undefined,
        landingCopy: form.landingCopy.trim() || undefined,
      });
      setForm(emptyForm);
      setSuccessMsg('Lead magnet created.');
      await load();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to create. file_id must exist in File Library.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (magnetId) => {
    if (!window.confirm('Delete this lead magnet?')) return;
    try {
      await deleteLeadMagnet(magnetId);
      if (selectedId === magnetId) {
        setSelectedId(null);
        setPerf(null);
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete.');
    }
  };

  const handlePerf = async (magnetId) => {
    setSelectedId(magnetId);
    setPerf(null);
    setError(null);
    try {
      const { data } = await getLeadMagnetPerformance(magnetId);
      setPerf(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load performance.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Lead Magnets</h1>
        <p className={styles.subtitle}>
          Link File Library assets as lead magnets. Upload the file in File Library first, then paste its file_id here.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>New lead magnet</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <label className={styles.full}>
            Title
            <input
              name="title"
              value={form.title}
              onChange={handleForm}
              required
              placeholder="e.g. Free cashflow checklist"
            />
          </label>
          <label className={styles.full}>
            File Library file_id
            <input
              name="fileId"
              value={form.fileId}
              onChange={handleForm}
              required
              placeholder="Paste file_id from File Library"
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
            Landing copy <span className={styles.optional}>(optional)</span>
            <input
              name="landingCopy"
              value={form.landingCopy}
              onChange={handleForm}
              placeholder="Short pitch shown on the landing page"
            />
          </label>
          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Saving…' : 'Create lead magnet'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Lead magnets</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>None yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>File</th>
                  <th>Source tag</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.magnet_id}>
                    <td>
                      {row.title}
                      {row.description && (
                        <div className={styles.sub}>{row.description}</div>
                      )}
                    </td>
                    <td className={styles.mono}>{row.file_id}</td>
                    <td className={styles.mono}>
                      {row.source_tag || '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => handlePerf(row.magnet_id)}
                      >
                        Performance
                      </button>
                      {' · '}
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(row.magnet_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedId && (
        <section className={styles.card}>
          <h2>Performance — {selectedId}</h2>
          {!perf ? (
            <p className={styles.muted}>Loading…</p>
          ) : (
            <pre className={styles.perfBox}>
              {JSON.stringify(perf, null, 2)}
            </pre>
          )}
        </section>
      )}
    </div>
  );
}
