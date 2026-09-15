// src/pages/marketing/Leads.jsx

import { useEffect, useState } from 'react';
import {
  listLeads,
  listHotLeads,
  getFunnelSummary,
  createLead,
  updateFunnelStage,
  logCall,
  addScore,
} from '../../api/endpoints/leads';
import styles from './Leads.module.css';

const STAGES = ['lead', 'contacted', 'qualified', 'trial', 'customer', 'lost'];
const OUTCOMES = [
  'no_answer',
  'left_voicemail',
  'interested',
  'not_interested',
  'callback_requested',
  'wrong_number',
];

const emptyForm = {
  fullName: '',
  phone: '',
  email: '',
  source: '',
  notes: '',
};

export default function Leads() {
  const [rows, setRows] = useState([]);
  const [hot, setHot] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [stageFilter, setStageFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Per-lead quick actions
  const [stageDraft, setStageDraft] = useState({});
  const [callDraft, setCallDraft] = useState({});
  const [scoreDraft, setScoreDraft] = useState({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, hotRes, funnelRes] = await Promise.all([
        listLeads({ funnelStage: stageFilter || undefined }),
        listHotLeads({ threshold: 20 }),
        getFunnelSummary(),
      ]);
      setRows(listRes.data);
      setHot(hotRes.data);
      setFunnel(funnelRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [stageFilter]);

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
      await createLead({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        source: form.source.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setForm(emptyForm);
      setSuccessMsg('Lead created.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create lead.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStage = async (leadId) => {
    const newStage = stageDraft[leadId];
    if (!newStage) return;
    try {
      await updateFunnelStage(leadId, newStage);
      setSuccessMsg('Stage updated.');
      setStageDraft((p) => {
        const n = { ...p };
        delete n[leadId];
        return n;
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update stage.');
    }
  };

  const handleCall = async (leadId) => {
    const d = callDraft[leadId] || {};
    if (!d.outcome) return;
    try {
      await logCall(leadId, { outcome: d.outcome, notes: d.notes });
      setSuccessMsg('Call logged.');
      setCallDraft((p) => {
        const n = { ...p };
        delete n[leadId];
        return n;
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to log call.');
    }
  };

  const handleScore = async (leadId) => {
    const d = scoreDraft[leadId] || {};
    if (d.points === undefined || d.points === '' || !d.reason?.trim()) {
      setError('Score needs points and a reason.');
      return;
    }
    try {
      await addScore(leadId, {
        points: Number(d.points),
        reason: d.reason.trim(),
      });
      setSuccessMsg('Score updated.');
      setScoreDraft((p) => {
        const n = { ...p };
        delete n[leadId];
        return n;
      });
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add score.');
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Lead Management</h1>
        <p className={styles.subtitle}>
          Capture leads, move them through the funnel, log calls, and score interest.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      {funnel.length > 0 && (
        <section className={styles.funnel}>
          {STAGES.map((stage) => {
            const row = funnel.find((f) => f.funnel_stage === stage);
            const count = row ? Number(row.count) : 0;
            return (
              <div key={stage} className={styles.funnelItem}>
                <span className={styles.funnelCount}>{count}</span>
                <span className={styles.funnelLabel}>{stage}</span>
              </div>
            );
          })}
        </section>
      )}

      {hot.length > 0 && (
        <section className={`${styles.card} ${styles.hotCard}`}>
          <h2>Hot leads (score ≥ 20)</h2>
          <ul className={styles.hotList}>
            {hot.map((lead) => (
              <li key={lead.lead_id}>
                <strong>{lead.full_name}</strong> — {lead.phone}
                {' · '}
                score {lead.score}
                {' · '}
                {lead.funnel_stage}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.card}>
        <h2>New lead</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <label>
            Full name
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Email <span className={styles.optional}>(optional)</span>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleForm}
            />
          </label>
          <label>
            Source <span className={styles.optional}>(optional)</span>
            <input
              name="source"
              value={form.source}
              onChange={handleForm}
              placeholder="e.g. Instagram, referral"
            />
          </label>
          <label className={styles.full}>
            Notes <span className={styles.optional}>(optional)</span>
            <input name="notes" value={form.notes} onChange={handleForm} />
          </label>
          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Saving…' : 'Add lead'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>All leads</h2>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className={styles.filter}
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No leads yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Stage</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((lead) => (
                  <tr key={lead.lead_id}>
                    <td>
                      {lead.full_name}
                      {lead.source && (
                        <div className={styles.sub}>{lead.source}</div>
                      )}
                    </td>
                    <td>
                      {lead.phone}
                      {lead.email && (
                        <div className={styles.sub}>{lead.email}</div>
                      )}
                    </td>
                    <td>
                      <span className={styles.badge}>{lead.funnel_stage}</span>
                    </td>
                    <td>{lead.score ?? 0}</td>
                    <td>
                      <div className={styles.actions}>
                        <div className={styles.actionRow}>
                          <select
                            value={stageDraft[lead.lead_id] || ''}
                            onChange={(e) =>
                              setStageDraft((p) => ({
                                ...p,
                                [lead.lead_id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">Stage…</option>
                            {STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => handleStage(lead.lead_id)}
                          >
                            Set
                          </button>
                        </div>
                        <div className={styles.actionRow}>
                          <select
                            value={callDraft[lead.lead_id]?.outcome || ''}
                            onChange={(e) =>
                              setCallDraft((p) => ({
                                ...p,
                                [lead.lead_id]: {
                                  ...p[lead.lead_id],
                                  outcome: e.target.value,
                                },
                              }))
                            }
                          >
                            <option value="">Call…</option>
                            {OUTCOMES.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => handleCall(lead.lead_id)}
                          >
                            Log
                          </button>
                        </div>
                        <div className={styles.actionRow}>
                          <input
                            type="number"
                            placeholder="pts"
                            className={styles.scoreInput}
                            value={scoreDraft[lead.lead_id]?.points ?? ''}
                            onChange={(e) =>
                              setScoreDraft((p) => ({
                                ...p,
                                [lead.lead_id]: {
                                  ...p[lead.lead_id],
                                  points: e.target.value,
                                },
                              }))
                            }
                          />
                          <input
                            placeholder="reason"
                            value={scoreDraft[lead.lead_id]?.reason || ''}
                            onChange={(e) =>
                              setScoreDraft((p) => ({
                                ...p,
                                [lead.lead_id]: {
                                  ...p[lead.lead_id],
                                  reason: e.target.value,
                                },
                              }))
                            }
                          />
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => handleScore(lead.lead_id)}
                          >
                            Score
                          </button>
                        </div>
                      </div>
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
