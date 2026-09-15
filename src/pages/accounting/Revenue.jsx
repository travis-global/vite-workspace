// src/pages/accounting/Revenue.jsx

import { useEffect, useState } from 'react';
import { listRevenue, addRevenue, deleteRevenue, requestDeleteRevenue, verifyDeleteRevenue } from '../../api/endpoints/revenue';
import styles from './Revenue.module.css';

const emptyForm = {
  description: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  source: '',
};

export default function Revenue() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listRevenue();
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load revenue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addRevenue({
        description: form.description.trim(),
        amount: Number(form.amount),
        date: form.date,
        source: form.source.trim() || undefined,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record revenue.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (revenueId) => {
    if (!window.confirm('Delete this revenue entry?')) return;
    try {
      await deleteRevenue(revenueId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Revenue Tracking</h1>
        <p className={styles.subtitle}>Record business income — subscriptions or any other source.</p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.card}>
        <h2>Record revenue</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Description
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              placeholder="e.g. Receipta Pro – June"
            />
          </label>

          <label>
            Amount (₦)
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              required
              placeholder="0.00"
            />
          </label>

          <label>
            Date
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Source <span className={styles.optional}>(optional)</span>
            <input
              name="source"
              value={form.source}
              onChange={handleChange}
              placeholder="e.g. receipta_subscriptions"
            />
          </label>

          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Saving…' : 'Record revenue'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Entries</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No revenue recorded yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Source</th>
                  <th className={styles.num}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.revenue_id}>
                    <td>{row.date}</td>
                    <td>{row.description}</td>
                    <td>{row.source || '—'}</td>
                    <td className={styles.num}>
                      <span className="money">
                        <span className="symbol">₦</span>
                        {Number(row.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(row.revenue_id)}
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
    </div>
  );
}
