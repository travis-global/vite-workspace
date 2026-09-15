// src/pages/accounting/Disbursements.jsx

import { useEffect, useState } from 'react';
import {
  listDisbursements,
  requestDisbursement,
  verifyDisbursement,
} from '../../api/endpoints/disbursements';
import styles from './Disbursements.module.css';

const SOURCE_ACCOUNTS = [
  { value: 'operating_expenses', label: 'Operating expenses' },
  { value: 'salary', label: 'Salary' },
  { value: 'savings', label: 'Savings' },
  { value: 'profit', label: 'Profit' },
];

// Common Nigerian banks (Paystack codes). No /banks route exists yet.
const BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Citibank Nigeria', code: '023' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Heritage Bank', code: '030' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Standard Chartered Bank', code: '068' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank For Africa', code: '033' },
  { name: 'Unity Bank', code: '215' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'OPay', code: '999992' },
  { name: 'PalmPay', code: '999991' },
];

const emptyForm = {
  purpose: '',
  recipientName: '',
  recipientAccountNumber: '',
  recipientBankCode: '',
  amount: '',
  sourceAccount: 'operating_expenses',
};

export default function Disbursements() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listDisbursements({
        status: statusFilter || undefined,
      });
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load disbursements.');
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

  const handleRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { data } = await requestDisbursement({
        purpose: form.purpose.trim(),
        recipientName: form.recipientName.trim(),
        recipientAccountNumber: form.recipientAccountNumber.trim(),
        recipientBankCode: form.recipientBankCode.trim(),
        amount: Number(form.amount),
        sourceAccount: form.sourceAccount,
      });
      setPendingRequestId(data.request_id);
      setSuccessMsg(data.message);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request disbursement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!pendingRequestId) return;
    setVerifying(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { data } = await verifyDisbursement(pendingRequestId, code.trim());
      setSuccessMsg(
        `Disbursement ${data.status === 'completed' ? 'completed' : data.status}.`
      );
      setPendingRequestId(null);
      setCode('');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const statusClass = (status) => {
    if (status === 'completed') return styles.badgeOk;
    if (status === 'pending_verification') return styles.badgeWarn;
    if (status === 'failed' || status === 'expired') return styles.badgeBad;
    return styles.badgeMuted;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Finance Disbursement</h1>
        <p className={styles.subtitle}>
          Request a transfer → Director receives a one-time code → enter code to execute via Paystack.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>Request disbursement</h2>
        <form className={styles.form} onSubmit={handleRequest}>
          <label className={styles.full}>
            Purpose
            <input
              name="purpose"
              value={form.purpose}
              onChange={handleChange}
              required
              placeholder="What is this payment for?"
            />
          </label>

          <label>
            Recipient name
            <input
              name="recipientName"
              value={form.recipientName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Account number
            <input
              name="recipientAccountNumber"
              value={form.recipientAccountNumber}
              onChange={handleChange}
              required
              inputMode="numeric"
            />
          </label>

          <label>
            Bank
            <select
              name="recipientBankCode"
              value={form.recipientBankCode}
              onChange={handleChange}
              required
            >
              <option value="">Select bank</option>
              {BANKS.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
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
            />
          </label>

          <label>
            Source account
            <select
              name="sourceAccount"
              value={form.sourceAccount}
              onChange={handleChange}
              required
            >
              {SOURCE_ACCOUNTS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Requesting…' : 'Request disbursement'}
          </button>
        </form>
      </section>

      {pendingRequestId && (
        <section className={`${styles.card} ${styles.verifyCard}`}>
          <h2>Enter Director code</h2>
          <p className={styles.hint}>
            Request <code>{pendingRequestId}</code> is waiting. Get the one-time code from the Director (also in their notifications), then submit below. Code expires in 15 minutes.
          </p>
          <form className={styles.verifyForm} onSubmit={handleVerify}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="One-time code"
              required
              autoComplete="one-time-code"
            />
            <button type="submit" disabled={verifying} className={styles.primaryBtn}>
              {verifying ? 'Verifying…' : 'Verify & transfer'}
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                setPendingRequestId(null);
                setCode('');
              }}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>History</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filter}
          >
            <option value="">All</option>
            <option value="pending_verification">Pending verification</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No disbursements yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Purpose</th>
                  <th>Recipient</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th className={styles.num}>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.request_id}>
                    <td>{row.purpose}</td>
                    <td>
                      {row.recipient_name}
                      <div className={styles.sub}>
                        {row.recipient_account_number}
                      </div>
                    </td>
                    <td>{(row.source_account || '').replace(/_/g, ' ')}</td>
                    <td>
                      <span className={statusClass(row.status)}>{row.status}</span>
                    </td>
                    <td className={styles.num}>
                      <span className="money">
                        <span className="symbol">₦</span>
                        {Number(row.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      {row.status === 'pending_verification' && (
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => {
                            setPendingRequestId(row.request_id);
                            setCode('');
                            setSuccessMsg(null);
                            setError(null);
                          }}
                        >
                          Enter code
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
