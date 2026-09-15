// src/pages/accounting/VendorSubscriptions.jsx

import { useEffect, useState } from 'react';
import {
  listVendorSubscriptions,
  addVendorSubscription,
  cancelVendorSubscription,
  getUpcomingRenewals,
} from '../../api/endpoints/vendorSubscriptions';
import styles from './VendorSubscriptions.module.css';

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'one_time', label: 'One-time' },
];

const emptyForm = {
  vendorName: '',
  amount: '',
  billingCycle: 'monthly',
  serviceDescription: '',
  renewalDate: '',
};

export default function VendorSubscriptions() {
  const [rows, setRows] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState(''); // '' = all
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, upcomingRes] = await Promise.all([
        listVendorSubscriptions({ status: statusFilter || undefined }),
        getUpcomingRenewals({ withinDays: 14 }),
      ]);
      setRows(listRes.data);
      setUpcoming(upcomingRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load vendor subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await addVendorSubscription({
        vendorName: form.vendorName.trim(),
        amount: Number(form.amount),
        billingCycle: form.billingCycle,
        serviceDescription: form.serviceDescription.trim() || undefined,
        renewalDate: form.renewalDate || undefined,
      });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (subscriptionId) => {
    if (!window.confirm('Cancel this vendor subscription?')) return;
    try {
      await cancelVendorSubscription(subscriptionId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Vendor Subscriptions</h1>
        <p className={styles.subtitle}>
          Track outgoing subscriptions — hosting, AI APIs, Paystack fees, etc.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {upcoming.length > 0 && (
        <section className={`${styles.card} ${styles.warningCard}`}>
          <h2>Upcoming renewals (14 days)</h2>
          <ul className={styles.upcomingList}>
            {upcoming.map((item) => (
              <li key={item.subscription_id}>
                <strong>{item.vendor_name}</strong>
                {' — '}
                <span className="money">
                  <span className="symbol">₦</span>
                  {Number(item.amount).toLocaleString()}
                </span>
                {' · '}
                {item.renewal_date}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.card}>
        <h2>Add subscription</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Vendor name
            <input
              name="vendorName"
              value={form.vendorName}
              onChange={handleChange}
              required
              placeholder="e.g. Groq, Vercel, Paystack"
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
            Billing cycle
            <select
              name="billingCycle"
              value={form.billingCycle}
              onChange={handleChange}
              required
            >
              {BILLING_CYCLES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Renewal date <span className={styles.optional}>(optional)</span>
            <input
              name="renewalDate"
              type="date"
              value={form.renewalDate}
              onChange={handleChange}
            />
          </label>

          <label className={styles.full}>
            Service description <span className={styles.optional}>(optional)</span>
            <input
              name="serviceDescription"
              value={form.serviceDescription}
              onChange={handleChange}
              placeholder="What this subscription covers"
            />
          </label>

          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Saving…' : 'Add subscription'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Subscriptions</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filter}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No vendor subscriptions yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Service</th>
                  <th>Cycle</th>
                  <th>Renewal</th>
                  <th>Status</th>
                  <th className={styles.num}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.subscription_id}>
                    <td>{row.vendor_name}</td>
                    <td>{row.service_description || '—'}</td>
                    <td>{row.billing_cycle}</td>
                    <td>{row.renewal_date || '—'}</td>
                    <td>
                      <span
                        className={
                          row.status === 'active' ? styles.badgeActive : styles.badgeCancelled
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className={styles.num}>
                      <span className="money">
                        <span className="symbol">₦</span>
                        {Number(row.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      {row.status === 'active' && (
                        <button
                          type="button"
                          className={styles.dangerBtn}
                          onClick={() => handleCancel(row.subscription_id)}
                        >
                          Cancel
                        </button>
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
