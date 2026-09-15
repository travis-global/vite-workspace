// src/pages/accounting/Salary.jsx

import { useEffect, useState } from 'react';
import {
  listStaffSalaries,
  setStaffSalary,
  listPayrollRuns,
  getPayrollRun,
  createPayrollRun,
  verifyPayrollRun,
} from '../../api/endpoints/salary';
import styles from './Salary.module.css';

const emptySalary = {
  userId: '',
  monthlyAmount: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankCode: '',
};

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [runs, setRuns] = useState([]);
  const [form, setForm] = useState(emptySalary);
  const [period, setPeriod] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [pendingRunId, setPendingRunId] = useState(null);
  const [code, setCode] = useState('');
  const [activeRun, setActiveRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, rRes] = await Promise.all([
        listStaffSalaries(),
        listPayrollRuns(),
      ]);
      setSalaries(sRes.data || []);
      setRuns(rRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load salary data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSaveSalary = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await setStaffSalary({
        userId: form.userId.trim(),
        monthlyAmount: Number(form.monthlyAmount),
        bankAccountName: form.bankAccountName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        bankCode: form.bankCode.trim(),
      });
      setForm(emptySalary);
      setSuccessMsg('Salary details saved.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateRun = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { data } = await createPayrollRun({
        period: period.trim(),
        userIds: selectedUserIds.length ? selectedUserIds : undefined,
      });
      setPendingRunId(data.run_id);
      setCode('');
      setSuccessMsg(data.message || 'Director code requested.');
      setPeriod('');
      setSelectedUserIds([]);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create payroll run.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!pendingRunId) return;
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { data } = await verifyPayrollRun(pendingRunId, code.trim());
      setActiveRun(data);
      setSuccessMsg(
        'Payroll finished: ' + (data.status || 'done') + '. Check item statuses below.'
      );
      setPendingRunId(null);
      setCode('');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification / run failed.');
    } finally {
      setBusy(false);
    }
  };

  const openRun = async (runId) => {
    try {
      const { data } = await getPayrollRun(runId);
      setActiveRun(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load run.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Salary Payment</h1>
        <p className={styles.subtitle}>
          Store staff bank/salary details, then run payroll. One Director code
          authorizes the whole batch (not each person).
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>Staff salary details</h2>
        <form className={styles.form} onSubmit={handleSaveSalary}>
          <label>
            User id
            <input
              name="userId"
              value={form.userId}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Monthly amount (₦)
            <input
              name="monthlyAmount"
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyAmount}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Account name
            <input
              name="bankAccountName"
              value={form.bankAccountName}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Account number
            <input
              name="bankAccountNumber"
              value={form.bankAccountNumber}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Bank code
            <input
              name="bankCode"
              value={form.bankCode}
              onChange={handleForm}
              required
              placeholder="Paystack bank code"
            />
          </label>
          <button type="submit" disabled={busy} className={styles.primaryBtn}>
            Save details
          </button>
        </form>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : salaries.length === 0 ? (
          <p className={styles.muted}>No salary details yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Account</th>
                  <th>Bank code</th>
                  <th>In next run</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map((s) => (
                  <tr key={s.user_id}>
                    <td className={styles.mono}>{s.user_id}</td>
                    <td className={styles.num}>
                      <span className="money">
                        <span className="symbol">₦</span>
                        {Number(s.monthly_amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      {s.bank_account_name}
                      <div className={styles.sub}>{s.bank_account_number}</div>
                    </td>
                    <td>{s.bank_code}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(s.user_id)}
                        onChange={() => toggleUser(s.user_id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2>Create payroll run</h2>
        <p className={styles.hint}>
          Leave checkboxes empty to pay <strong>everyone</strong> with salary
          details. Tick specific people for a partial/off-cycle run.
        </p>
        <form className={styles.formRow} onSubmit={handleCreateRun}>
          <input
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            placeholder="Period e.g. 2026-09"
            required
          />
          <button type="submit" disabled={busy} className={styles.primaryBtn}>
            Request Director code
          </button>
        </form>
      </section>

      {pendingRunId && (
        <section className={styles.verifyCard}>
          <h2>Enter Director code</h2>
          <p className={styles.hint}>
            Run <code>{pendingRunId}</code> — code expires in 15 minutes. Code
            is in the Director’s Notifications.
          </p>
          <form className={styles.formRow} onSubmit={handleVerify}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="One-time code"
              required
              autoComplete="one-time-code"
            />
            <button type="submit" disabled={busy} className={styles.primaryBtn}>
              Verify &amp; pay batch
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                setPendingRunId(null);
                setCode('');
              }}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      <section className={styles.card}>
        <h2>Payroll runs</h2>
        {runs.length === 0 ? (
          <p className={styles.muted}>No runs yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.run_id}>
                    <td>{r.period}</td>
                    <td className={styles.num}>
                      <span className="money">
                        <span className="symbol">₦</span>
                        {Number(r.total_amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className={styles.badge}>{r.status}</span>
                    </td>
                    <td>{r.created_at}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => openRun(r.run_id)}
                      >
                        Details
                      </button>
                      {r.status === 'pending_verification' && (
                        <>
                          {' · '}
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => {
                              setPendingRunId(r.run_id);
                              setCode('');
                            }}
                          >
                            Enter code
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

      {activeRun && (
        <section className={styles.card}>
          <h2>
            Run {activeRun.period} — {activeRun.status}
          </h2>
          <p className={styles.hint}>
            Total:{' '}
            <span className="money">
              <span className="symbol">₦</span>
              {Number(activeRun.total_amount).toLocaleString()}
            </span>
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference / failure</th>
                </tr>
              </thead>
              <tbody>
                {(activeRun.items || []).map((item) => (
                  <tr key={item.item_id}>
                    <td className={styles.mono}>{item.user_id}</td>
                    <td className={styles.num}>
                      <span className="money">
                        <span className="symbol">₦</span>
                        {Number(item.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>{item.status}</td>
                    <td className={styles.mono}>
                      {item.paystack_reference || item.failure_reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
