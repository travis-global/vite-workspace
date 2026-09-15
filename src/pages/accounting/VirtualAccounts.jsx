// src/pages/accounting/VirtualAccounts.jsx

import { useEffect, useState } from 'react';
import {
  listVirtualAccounts,
  getAccountHistory,
  updateAllocationPercentages,
} from '../../api/endpoints/virtualAccounts';
import styles from './VirtualAccounts.module.css';

const ACCOUNT_ORDER = ['salary', 'operating_expenses', 'savings', 'profit'];

export default function VirtualAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [percentForm, setPercentForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listVirtualAccounts();
      const sorted = [...data].sort(
        (a, b) => ACCOUNT_ORDER.indexOf(a.account_key) - ACCOUNT_ORDER.indexOf(b.account_key)
      );
      setAccounts(sorted);
      const form = {};
      sorted.forEach((a) => {
        form[a.account_key] = a.allocation_percentage;
      });
      setPercentForm(form);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load virtual accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openHistory = async (accountKey) => {
    setSelectedKey(accountKey);
    setHistoryLoading(true);
    setError(null);
    try {
      const { data } = await getAccountHistory(accountKey);
      setHistory(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load history.');
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePercentChange = (key, value) => {
    setPercentForm((prev) => ({ ...prev, [key]: value }));
  };

  const percentSum = Object.values(percentForm).reduce(
    (s, v) => s + (Number(v) || 0),
    0
  );

  const handleSavePercentages = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {};
    for (const key of ACCOUNT_ORDER) {
      payload[key] = Number(percentForm[key]);
    }

    if (Math.abs(percentSum - 100) > 0.01) {
      setError('Percentages must sum to exactly 100.');
      setSaving(false);
      return;
    }

    try {
      await updateAllocationPercentages(payload);
      setSuccessMsg('Allocation percentages updated. Applies to future revenue only.');
      await load();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to update percentages (Director or admin only).'
      );
    } finally {
      setSaving(false);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const selectedAccount = accounts.find((a) => a.account_key === selectedKey);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Virtual Accounts</h1>
        <p className={styles.subtitle}>
          Internal ledger buckets. Revenue splits here by percentage; expenses deduct from operating expenses.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <>
          <section className={styles.summary}>
            <span className={styles.summaryLabel}>Total across buckets</span>
            <span className="money">
              <span className="symbol">₦</span>
              {totalBalance.toLocaleString()}
            </span>
          </section>

          <section className={styles.grid}>
            {accounts.map((account) => (
              <button
                key={account.account_key}
                type="button"
                className={`${styles.accountCard} ${
                  selectedKey === account.account_key ? styles.accountCardActive : ''
                }`}
                onClick={() => openHistory(account.account_key)}
              >
                <span className={styles.accountName}>
                  {account.display_name || account.account_key.replace(/_/g, ' ')}
                </span>
                <span className={styles.accountBalance}>
                  <span className="money">
                    <span className="symbol">₦</span>
                    {Number(account.balance).toLocaleString()}
                  </span>
                </span>
                <span className={styles.accountPct}>
                  {account.allocation_percentage}% of new revenue
                </span>
              </button>
            ))}
          </section>

          <section className={styles.card}>
            <h2>Allocation percentages</h2>
            <p className={styles.hint}>
              Changes apply to future revenue only. Existing balances are not reallocated. Director or admin only.
            </p>
            <form className={styles.percentForm} onSubmit={handleSavePercentages}>
              {ACCOUNT_ORDER.map((key) => {
                const account = accounts.find((a) => a.account_key === key);
                const label = account?.display_name || key.replace(/_/g, ' ');
                return (
                  <label key={key}>
                    {label}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={percentForm[key] ?? ''}
                      onChange={(e) => handlePercentChange(key, e.target.value)}
                      required
                    />
                  </label>
                );
              })}
              <div className={styles.percentFooter}>
                <span className={percentSum === 100 ? styles.sumOk : styles.sumBad}>
                  Sum: {percentSum}%
                </span>
                <button type="submit" disabled={saving || percentSum !== 100} className={styles.primaryBtn}>
                  {saving ? 'Saving…' : 'Save percentages'}
                </button>
              </div>
            </form>
          </section>

          {selectedKey && (
            <section className={styles.card}>
              <h2>
                History — {selectedAccount?.display_name || selectedKey.replace(/_/g, ' ')}
              </h2>
              {historyLoading ? (
                <p className={styles.muted}>Loading…</p>
              ) : history.length === 0 ? (
                <p className={styles.muted}>No transactions yet.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>When</th>
                        <th>Reason</th>
                        <th className={styles.num}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((tx) => (
                        <tr key={tx.transaction_id || `\( {tx.created_at}- \){tx.amount}`}>
                          <td>{tx.created_at || '—'}</td>
                          <td>{tx.reason || tx.description || '—'}</td>
                          <td className={styles.num}>
                            <span className="money">
                              <span className="symbol">₦</span>
                              {Number(tx.amount).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
