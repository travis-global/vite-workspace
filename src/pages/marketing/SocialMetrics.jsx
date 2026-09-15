// src/pages/marketing/SocialMetrics.jsx

import { useEffect, useState } from 'react';
import {
  listMetrics,
  getPlatformSummary,
  logMetric,
} from '../../api/endpoints/socialMetrics';
import styles from './SocialMetrics.module.css';

const emptyForm = {
  platform: '',
  date: new Date().toISOString().slice(0, 10),
  postReference: '',
  contentCalendarEntryId: '',
  campaignId: '',
  likes: '0',
  comments: '0',
  shares: '0',
  reach: '0',
};

export default function SocialMetrics() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({
    platform: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        platform: filters.platform || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const [listRes, sumRes] = await Promise.all([
        listMetrics(params),
        getPlatformSummary({
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        }),
      ]);
      setRows(listRes.data);
      setSummary(sumRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load metrics.');
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

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await logMetric({
        platform: form.platform.trim(),
        date: form.date,
        postReference: form.postReference.trim() || undefined,
        contentCalendarEntryId: form.contentCalendarEntryId.trim() || undefined,
        campaignId: form.campaignId.trim() || undefined,
        likes: Number(form.likes) || 0,
        comments: Number(form.comments) || 0,
        shares: Number(form.shares) || 0,
        reach: Number(form.reach) || 0,
      });
      setForm(emptyForm);
      setSuccessMsg('Metric logged.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to log metric.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Social Metrics</h1>
        <p className={styles.subtitle}>
          Log engagement per post/platform. Optionally link a content calendar entry or campaign.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      {summary.length > 0 && (
        <section className={styles.summaryGrid}>
          {summary.map((row) => (
            <div key={row.platform} className={styles.summaryCard}>
              <span className={styles.summaryPlatform}>{row.platform}</span>
              <span>Reach: {Number(row.total_reach || 0).toLocaleString()}</span>
              <span>Likes: {Number(row.total_likes || 0).toLocaleString()}</span>
              <span>Comments: {Number(row.total_comments || 0).toLocaleString()}</span>
              <span>Shares: {Number(row.total_shares || 0).toLocaleString()}</span>
              <span className={styles.sub}>{row.posts_logged} posts logged</span>
            </div>
          ))}
        </section>
      )}

      <section className={styles.card}>
        <h2>Log metric</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <label>
            Platform
            <input
              name="platform"
              value={form.platform}
              onChange={handleForm}
              required
              placeholder="Instagram, TikTok, X…"
            />
          </label>
          <label>
            Date
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Post reference <span className={styles.optional}>(optional)</span>
            <input
              name="postReference"
              value={form.postReference}
              onChange={handleForm}
              placeholder="URL or post id"
            />
          </label>
          <label>
            Calendar entry id <span className={styles.optional}>(optional)</span>
            <input
              name="contentCalendarEntryId"
              value={form.contentCalendarEntryId}
              onChange={handleForm}
            />
          </label>
          <label>
            Campaign id <span className={styles.optional}>(optional)</span>
            <input
              name="campaignId"
              value={form.campaignId}
              onChange={handleForm}
            />
          </label>
          <label>
            Likes
            <input
              name="likes"
              type="number"
              min="0"
              value={form.likes}
              onChange={handleForm}
            />
          </label>
          <label>
            Comments
            <input
              name="comments"
              type="number"
              min="0"
              value={form.comments}
              onChange={handleForm}
            />
          </label>
          <label>
            Shares
            <input
              name="shares"
              type="number"
              min="0"
              value={form.shares}
              onChange={handleForm}
            />
          </label>
          <label>
            Reach
            <input
              name="reach"
              type="number"
              min="0"
              value={form.reach}
              onChange={handleForm}
            />
          </label>
          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Saving…' : 'Log metric'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Logged metrics</h2>
        </div>
        <div className={styles.filters}>
          <input
            name="platform"
            value={filters.platform}
            onChange={handleFilter}
            placeholder="Platform"
          />
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilter}
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilter}
          />
          <button type="button" className={styles.primaryBtn} onClick={load}>
            Apply
          </button>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No metrics yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Platform</th>
                  <th>Ref</th>
                  <th className={styles.num}>Likes</th>
                  <th className={styles.num}>Comments</th>
                  <th className={styles.num}>Shares</th>
                  <th className={styles.num}>Reach</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.metric_id}>
                    <td>{row.date}</td>
                    <td>{row.platform}</td>
                    <td>{row.post_reference || '—'}</td>
                    <td className={styles.num}>{row.likes}</td>
                    <td className={styles.num}>{row.comments}</td>
                    <td className={styles.num}>{row.shares}</td>
                    <td className={styles.num}>{row.reach}</td>
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
