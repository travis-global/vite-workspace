// src/pages/accounting/Invoices.jsx

import { useEffect, useState } from 'react';
import { listInvoices, createAndSendInvoice } from '../../api/endpoints/invoices';
import styles from './Invoices.module.css';

const emptyLine = { description: '', amount: '' };

const emptyForm = {
  clientName: '',
  clientEmail: '',
  dueDate: '',
  lineItems: [{ ...emptyLine }],
};

export default function Invoices() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listInvoices({ status: statusFilter || undefined });
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.lineItems];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, lineItems: next };
    });
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { ...emptyLine }],
    }));
  };

  const removeLine = (index) => {
    setForm((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const totalPreview = form.lineItems.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const lineItems = form.lineItems
      .filter((item) => item.description.trim() && Number(item.amount) > 0)
      .map((item) => ({
        description: item.description.trim(),
        amount: Number(item.amount),
      }));

    if (lineItems.length === 0) {
      setError('Add at least one line item with description and amount.');
      setSubmitting(false);
      return;
    }

    try {
      const { data } = await createAndSendInvoice({
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim(),
        lineItems,
        dueDate: form.dueDate || undefined,
      });
      setForm(emptyForm);
      setSuccessMsg(
        data.sent
          ? `Invoice ${data.invoice_number} created and emailed.`
          : `Invoice ${data.invoice_number} created, but email failed to send.`
      );
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const parseLineItems = (raw) => {
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw || '[]');
    } catch {
      return [];
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Invoicing</h1>
        <p className={styles.subtitle}>
          Create an invoice and email it to the client in one step.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>New invoice</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Client name
            <input
              name="clientName"
              value={form.clientName}
              onChange={handleField}
              required
              placeholder="Client or company name"
            />
          </label>

          <label>
            Client email
            <input
              name="clientEmail"
              type="email"
              value={form.clientEmail}
              onChange={handleField}
              required
              placeholder="client@example.com"
            />
          </label>

          <label>
            Due date <span className={styles.optional}>(optional)</span>
            <input
              name="dueDate"
              type="date"
              value={form.dueDate}
              onChange={handleField}
            />
          </label>

          <div className={styles.linesSection}>
            <div className={styles.linesHeader}>
              <span>Line items</span>
              <button type="button" className={styles.addLineBtn} onClick={addLine}>
                + Add line
              </button>
            </div>

            {form.lineItems.map((item, index) => (
              <div key={index} className={styles.lineRow}>
                <input
                  value={item.description}
                  onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                  placeholder="Description"
                  required
                />
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => handleLineChange(index, 'amount', e.target.value)}
                  placeholder="Amount"
                  required
                />
                {form.lineItems.length > 1 && (
                  <button
                    type="button"
                    className={styles.removeLineBtn}
                    onClick={() => removeLine(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <p className={styles.totalPreview}>
              Total:{' '}
              <span className="money">
                <span className="symbol">₦</span>
                {totalPreview.toLocaleString()}
              </span>
            </p>
          </div>

          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Creating & sending…' : 'Create & send invoice'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Invoices</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filter}
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
          </select>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No invoices yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Client</th>
                  <th>Email</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th className={styles.num}>Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.invoice_id}>
                    <td>{row.invoice_number}</td>
                    <td>{row.client_name}</td>
                    <td>{row.client_email}</td>
                    <td>{row.due_date || '—'}</td>
                    <td>
                      <span
                        className={
                          row.status === 'sent' ? styles.badgeSent : styles.badgeDraft
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className={styles.num}>
                      <span className="money">
                        <span className="symbol">₦</span>
                        {Number(row.total_amount).toLocaleString()}
                      </span>
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
