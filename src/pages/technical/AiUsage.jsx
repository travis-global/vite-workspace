// src/pages/technical/AiUsage.jsx

import { useCallback, useEffect, useState } from 'react';
import {
  getAiUsage,
  updateAiUsageThresholds,
  listAiNotifications,
  markAiNotificationRead,
  markAllAiNotificationsRead,
} from '../../api/endpoints/aiUsage';
import styles from './AiUsage.module.css';

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

function moneyUsd(n) {
  const v = Number(n) || 0;
  return `$${v.toFixed(4)}`;
}

function pct(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

export default function AiUsage() {
  const [period, setPeriod] = useState('today');
  const [usage, setUsage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [thresholdForm, setThresholdForm] = useState({
    max_calls_per_day: 500,
    max_cost_usd_per_day: 5,
    warn_at_pct: 70,
    critical_at_pct: 90,
    email_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);

  const loadUsage = useCallback(async () => {
    const { data } = await getAiUsage(period);
    setUsage(data);
    if (data?.thresholds) {
      setThresholdForm({
        max_calls_per_day: data.thresholds.max_calls_per_day ?? 500,
        max_cost_usd_per_day: data.thresholds.max_cost_usd_per_day ?? 5,
        warn_at_pct: data.thresholds.warn_at_pct ?? 70,
        critical_at_pct: data.thresholds.critical_at_pct ?? 90,
        email_enabled: Boolean(data.thresholds.email_enabled),
      });
    }
  }, [period]);

  const loadNotifications = useCallback(async () => {
    const { data } = await listAiNotifications({ unreadOnly });
    setNotifications(Array.isArray(data) ? data : data?.items || []);
  }, [unreadOnly]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadUsage(), loadNotifications()]);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load AI usage.');
    } finally {
      setLoading(false);
    }
  }, [loadUsage, loadNotifications]);

  useEffect(() => {
    reload();
  }, [reload]);

  const totals = usage?.totals || {};
  const byProvider = usage?.by_provider || [];
  const maxCalls = Number(thresholdForm.max_calls_per_day) || 1;
  const maxCost = Number(thresholdForm.max_cost_usd_per_day) || 0.0001;
  // Progress vs daily caps — only meaningful for period=today; still show for other periods as soft indicator
  const callsProgress = Math.min(100, ((Number(totals.calls) || 0) / maxCalls) * 100);
  const costProgress = Math.min(100, ((Number(totals.estimated_cost_usd) || 0) / maxCost) * 100);

  const successRate =
    totals.calls > 0 ? (Number(totals.successes) || 0) / Number(totals.calls) : null;

  async function handleSaveThresholds(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);
    setError(null);
    try {
      await updateAiUsageThresholds({
        max_calls_per_day: Number(thresholdForm.max_calls_per_day),
        max_cost_usd_per_day: Number(thresholdForm.max_cost_usd_per_day),
        warn_at_pct: Number(thresholdForm.warn_at_pct),
        critical_at_pct: Number(thresholdForm.critical_at_pct),
        email_enabled: Boolean(thresholdForm.email_enabled),
      });
      setSaveMsg('Thresholds saved.');
      await loadUsage();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save thresholds.');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkRead(id) {
    try {
      await markAiNotificationRead(id);
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not mark notification read.');
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAiNotificationsRead();
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not mark all read.');
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>AI Usage Monitor</h1>
        <p className={styles.subtitle}>
          Receipta bot model usage — Groq, Gemini, Mistral. In-app + email alerts only (no WhatsApp).
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {saveMsg && <div className={styles.success}>{saveMsg}</div>}

      <div className={styles.periodRow}>
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={period === p.value ? styles.periodActive : styles.periodBtn}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
        <button type="button" className={styles.secondaryBtn} onClick={reload}>
          Refresh
        </button>
      </div>

      {loading && !usage ? (
        <p className={styles.muted}>Loading…</p>
      ) : (
        <>
          <section className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Calls</span>
              <span className={styles.statValue}>{totals.calls ?? 0}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Success rate</span>
              <span className={styles.statValue}>
                {successRate == null ? '—' : pct(successRate)}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total tokens</span>
              <span className={styles.statValue}>
                {(totals.total_tokens ?? 0).toLocaleString()}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Est. cost (USD)</span>
              <span className={styles.statValue}>
                {moneyUsd(totals.estimated_cost_usd)}
              </span>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Daily limit progress</h2>
            <p className={styles.muted}>
              Compared to max calls/day and max cost/day
              {period !== 'today' ? ' (period is not “today” — indicator only)' : ''}.
            </p>
            <div className={styles.progressBlock}>
              <div className={styles.progressLabel}>
                <span>Calls</span>
                <span>
                  {totals.calls ?? 0} / {maxCalls}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFill}
                  style={{ width: `${callsProgress}%` }}
                />
              </div>
            </div>
            <div className={styles.progressBlock}>
              <div className={styles.progressLabel}>
                <span>Cost</span>
                <span>
                  {moneyUsd(totals.estimated_cost_usd)} / {moneyUsd(maxCost)}
                </span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.barFillCost}
                  style={{ width: `${costProgress}%` }}
                />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <h2>By provider</h2>
            {byProvider.length === 0 ? (
              <p className={styles.muted}>No AI calls in this period.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Model</th>
                      <th>Calls</th>
                      <th>Success</th>
                      <th>Tokens</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byProvider.map((row, i) => (
                      <tr key={`\( {row.provider}- \){row.model}-${i}`}>
                        <td>{row.provider}</td>
                        <td className={styles.mono}>{row.model}</td>
                        <td>{row.calls}</td>
                        <td>
                          {row.success_rate != null
                            ? pct(row.success_rate)
                            : row.calls
                              ? pct(row.successes / row.calls)
                              : '—'}
                        </td>
                        <td>{(row.total_tokens ?? 0).toLocaleString()}</td>
                        <td>{moneyUsd(row.estimated_cost_usd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={styles.card}>
            <h2>Alert thresholds</h2>
            <form className={styles.form} onSubmit={handleSaveThresholds}>
              <label>
                Max calls / day
                <input
                  type="number"
                  min="1"
                  value={thresholdForm.max_calls_per_day}
                  onChange={(e) =>
                    setThresholdForm((f) => ({
                      ...f,
                      max_calls_per_day: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Max cost USD / day
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={thresholdForm.max_cost_usd_per_day}
                  onChange={(e) =>
                    setThresholdForm((f) => ({
                      ...f,
                      max_cost_usd_per_day: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Warn at %
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={thresholdForm.warn_at_pct}
                  onChange={(e) =>
                    setThresholdForm((f) => ({ ...f, warn_at_pct: e.target.value }))
                  }
                />
              </label>
              <label>
                Critical at %
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={thresholdForm.critical_at_pct}
                  onChange={(e) =>
                    setThresholdForm((f) => ({
                      ...f,
                      critical_at_pct: e.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={thresholdForm.email_enabled}
                  onChange={(e) =>
                    setThresholdForm((f) => ({
                      ...f,
                      email_enabled: e.target.checked,
                    }))
                  }
                />
                Email alerts when thresholds hit
              </label>
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? 'Saving…' : 'Save thresholds'}
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <div className={styles.notifHead}>
              <h2>AI alert notifications</h2>
              <div className={styles.notifActions}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={unreadOnly}
                    onChange={(e) => setUnreadOnly(e.target.checked)}
                  />
                  Unread only
                </label>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
              </div>
            </div>
            {notifications.length === 0 ? (
              <p className={styles.muted}>No notifications.</p>
            ) : (
              <ul className={styles.notifList}>
                {notifications.map((n) => {
                  const unread = !(n.is_read === 1 || n.is_read === true);
                  return (
                    <li
                      key={n.id}
                      className={unread ? styles.notifUnread : styles.notifItem}
                    >
                      <div className={styles.notifTitleRow}>
                        <strong>{n.title}</strong>
                        <span className={styles.severity}>{n.severity || n.kind}</span>
                        <span className={styles.time}>{n.created_at}</span>
                      </div>
                      <p className={styles.notifBody}>{n.body}</p>
                      {unread && (
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => handleMarkRead(n.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
