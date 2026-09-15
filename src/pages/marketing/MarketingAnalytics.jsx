// src/pages/marketing/MarketingAnalytics.jsx

import { useEffect, useState } from 'react';
import { getOverview } from '../../api/endpoints/marketingAnalytics';
import styles from './MarketingAnalytics.module.css';

export default function MarketingAnalytics() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res } = await getOverview({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setData(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load analytics.');
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
    setTimeout(() => load(), 0);
  };

  const funnel = data?.funnel_summary || [];
  const contentBreakdown = data?.content_status_breakdown || {};
  const social = data?.social_platform_summary || [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Marketing Analytics</h1>
        <p className={styles.subtitle}>
          One screen: funnel, hot leads, content status, and social totals.
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
      ) : !data ? null : (
        <>
          <section className={styles.metrics}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Hot leads</span>
              <span className={styles.metricValue}>{data.hot_lead_count ?? 0}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Content entries</span>
              <span className={styles.metricValue}>{data.total_content_entries ?? 0}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Social platforms</span>
              <span className={styles.metricValue}>{social.length}</span>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Lead funnel</h2>
            {funnel.length === 0 ? (
              <p className={styles.muted}>No leads yet.</p>
            ) : (
              <div className={styles.funnel}>
                {funnel.map((row) => (
                  <div key={row.funnel_stage} className={styles.funnelItem}>
                    <span className={styles.funnelCount}>{row.count}</span>
                    <span className={styles.funnelLabel}>{row.funnel_stage}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2>Content by status</h2>
            {Object.keys(contentBreakdown).length === 0 ? (
              <p className={styles.muted}>No content in this period.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th className={styles.num}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(contentBreakdown).map(([status, count]) => (
                      <tr key={status}>
                        <td>{status}</td>
                        <td className={styles.num}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2>Social by platform</h2>
            {social.length === 0 ? (
              <p className={styles.muted}>No social metrics in this period.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Platform</th>
                      <th className={styles.num}>Reach</th>
                      <th className={styles.num}>Likes</th>
                      <th className={styles.num}>Comments</th>
                      <th className={styles.num}>Shares</th>
                      <th className={styles.num}>Posts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {social.map((row) => (
                      <tr key={row.platform}>
                        <td>{row.platform}</td>
                        <td className={styles.num}>
                          {Number(row.total_reach || 0).toLocaleString()}
                        </td>
                        <td className={styles.num}>
                          {Number(row.total_likes || 0).toLocaleString()}
                        </td>
                        <td className={styles.num}>
                          {Number(row.total_comments || 0).toLocaleString()}
                        </td>
                        <td className={styles.num}>
                          {Number(row.total_shares || 0).toLocaleString()}
                        </td>
                        <td className={styles.num}>{row.posts_logged}</td>
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
