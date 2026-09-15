// src/pages/marketing/Campaigns.jsx

import { useEffect, useState } from 'react';
import {
  listCampaigns,
  createCampaign,
  updateCampaignStatus,
  getCampaignPerformance,
} from '../../api/endpoints/campaigns';
import styles from './Campaigns.module.css';

const STATUSES = ['planning', 'active', 'paused', 'completed'];

const emptyForm = {
  name: '',
  channel: '',
  leadMagnetId: '',
  startDate: '',
  endDate: '',
  budget: '',
};

export default function Campaigns() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState('');
  const [statusDraft, setStatusDraft] = useState({});
  const [perf, setPerf] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listCampaigns({
        status: statusFilter || undefined,
      });
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await createCampaign({
        name: form.name.trim(),
        channel: form.channel.trim() || undefined,
        leadMagnetId: form.leadMagnetId.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        budget: form.budget !== '' ? Number(form.budget) : undefined,
      });
      setForm(emptyForm);
      setSuccessMsg('Campaign created.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (campaignId) => {
    const newStatus = statusDraft[campaignId];
    if (!newStatus) return;
    try {
      await updateCampaignStatus(campaignId, newStatus);
      setSuccessMsg('Status updated.');
      setStatusDraft((p) => {
        const n = { ...p };
        delete n[campaignId];
        return n;
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status.');
    }
  };

  const handlePerf = async (campaignId) => {
    setSelectedId(campaignId);
    setPerf(null);
    try {
      const { data } = await getCampaignPerformance(campaignId);
      setPerf(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load performance.');
    }
  };

  const statusClass = (status) => {
    if (status === 'active' || status === 'completed') return styles.badgeOk;
    if (status === 'planning') return styles.badgeWarn;
    if (status === 'paused') return styles.badgeMuted;
    return styles.badgeMuted;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Campaign Management</h1>
        <p className={styles.subtitle}>
          Group marketing activity by campaign — channel, dates, optional lead magnet, budget.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>New campaign</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <label className={styles.full}>
            Name
            <input
              name="name"
              value={form.name}
              onChange={handleForm}
              required
              placeholder="e.g. Q3 Instagram push"
            />
          </label>
          <label>
            Channel <span className={styles.optional}>(optional)</span>
            <input
              name="channel"
              value={form.channel}
              onChange={handleForm}
              placeholder="Instagram, WhatsApp…"
            />
          </label>
          <label>
            Lead magnet id <span className={styles.optional}>(optional)</span>
            <input
              name="leadMagnetId"
              value={form.leadMagnetId}
              onChange={handleForm}
              placeholder="magnet_id if linked"
            />
          </label>
          <label>
            Start date <span className={styles.optional}>(optional)</span>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleForm}
            />
          </label>
          <label>
            End date <span className={styles.optional}>(optional)</span>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleForm}
            />
          </label>
          <label>
            Budget (₦) <span className={styles.optional}>(optional)</span>
            <input
              name="budget"
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={handleForm}
            />
          </label>
          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Saving…' : 'Create campaign'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Campaigns</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.filter}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No campaigns yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Channel</th>
                  <th>Dates</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.campaign_id}>
                    <td>
                      {row.name}
                      {row.source_tag && (
                        <div className={styles.sub}>{row.source_tag}</div>
                      )}
                    </td>
                    <td>{row.channel || '—'}</td>
                    <td>
                      {(row.start_date || '…') + ' → ' + (row.end_date || '…')}
                    </td>
                    <td className={styles.num}>
                      {row.budget != null ? (
                        <span className="money">
                          <span className="symbol">₦</span>
                          {Number(row.budget).toLocaleString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={statusClass(row.status)}>{row.status}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <select
                          value={statusDraft[row.campaign_id] || ''}
                          onChange={(e) =>
                            setStatusDraft((p) => ({
                              ...p,
                              [row.campaign_id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Status…</option>
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => handleStatus(row.campaign_id)}
                        >
                          Set
                        </button>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => handlePerf(row.campaign_id)}
                        >
                          Performance
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedId && (
        <section className={styles.card}>
          <h2>Performance — {selectedId}</h2>
          {!perf ? (
            <p className={styles.muted}>Loading…</p>
          ) : (
            <pre className={styles.perfBox}>
              {JSON.stringify(perf, null, 2)}
            </pre>
          )}
        </section>
      )}
    </div>
  );
}
