// src/pages/accounting/FinancialReports.jsx

import { useEffect, useState } from 'react';
import { getPnl, getExpenseBreakdown } from '../../api/endpoints/financialReports';
import styles from './FinancialReports.module.css';

export default function FinancialReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pnl, setPnl] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const [pnlRes, breakdownRes] = await Promise.all([
        getPnl(params),
        getExpenseBreakdown(params),
      ]);
      setPnl(pnlRes.data);
      setBreakdown(breakdownRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApply = (e) => {
    e.preventDefault();
    load();
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    // reload with no dates on next tick after state clears
    setTimeout(() => load(), 0);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Financial Reports</h1>
        <p className={styles.subtitle}>
          P&amp;L and expense breakdown over the data you’ve recorded.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.card}>
        <form className={styles.filters} onSubmit={handleApply}>
          <label>
            From
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
          <div className={styles.filterActions}>
            <button type="submit" className={styles.primaryBtn}>
              Apply
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <>
          <section className={styles.metrics}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Revenue</span>
              <span className={styles.metricValue}>
                <span className="money">
                  <span className="symbol">₦</span>
                  {Number(pnl?.revenue ?? 0).toLocaleString()}
                </span>
              </span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Expenses</span>
              <span className={styles.metricValue}>
                <span className="money">
                  <span className="symbol">₦</span>
                  {Number(pnl?.expenses ?? 0).toLocaleString()}
                </span>
              </span>
            </div>
            <div
              className={`${styles.metricCard} ${
                Number(pnl?.net_profit ?? 0) >= 0 ? styles.metricPositive : styles.metricNegative
              }`}
            >
              <span className={styles.metricLabel}>Net profit</span>
              <span className={styles.metricValue}>
                <span className="money">
                  <span className="symbol">₦</span>
                  {Number(pnl?.net_profit ?? 0).toLocaleString()}
                </span>
              </span>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Expense breakdown by category</h2>
            {breakdown.length === 0 ? (
              <p className={styles.muted}>No expenses in this period.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className={styles.num}>Total</th>
                      <th className={styles.num}>Share</th>
                      <th className={styles.barCol}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((row) => (
                      <tr key={row.category}>
                        <td>{row.category}</td>
                        <td className={styles.num}>
                          <span className="money">
                            <span className="symbol">₦</span>
                            {Number(row.total).toLocaleString()}
                          </span>
                        </td>
                        <td className={styles.num}>{Number(row.percent).toFixed(1)}%</td>
                        <td className={styles.barCol}>
                          <div className={styles.barTrack}>
                            <div
                              className={styles.barFill}
                              style={{ width: `${Math.min(row.percent, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
