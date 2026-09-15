// src/pages/accounting/ReceiptaSubscriptions.jsx

import { useEffect, useState } from 'react';
import {
  listSubscribers,
  getSubscriber,
  setSubscriberTier,
  updateSubscriptionDates,
  blockSubscriber,
  unblockSubscriber,
  deleteSubscriber,
} from '../../api/endpoints/receiptaSubscriptions';
import styles from './ReceiptaSubscriptions.module.css';

export default function ReceiptaSubscriptions() {
  const [rows, setRows] = useState([]);
  const [tierFilter, setTierFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [tierValue, setTierValue] = useState('basic');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listSubscribers({
        tier: tierFilter || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg =
        err.response?.status === 502
          ? 'Receipta API unreachable (502). Internal endpoints may not be live yet.'
          : err.response?.data?.detail || 'Failed to load subscribers.';
      setError(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tierFilter]);

  const openDetail = async (userId) => {
    setSelected(userId);
    setDetail(null);
    setDetailLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { data } = await getSubscriber(userId);
      setDetail(data);
      setTierValue(data.tier || data.plan || 'basic');
      setStartDate(data.start_date || '');
      setEndDate(data.end_date || '');
      setBlockReason('');
    } catch (err) {
      setError(
        err.response?.status === 502
          ? 'Could not load subscriber from Receipta (502).'
          : err.response?.data?.detail || 'Failed to load subscriber.'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async (fn, successText) => {
    if (!selected) return;
    setActing(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await fn();
      setSuccessMsg(successText);
      await openDetail(selected);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Action failed.');
    } finally {
      setActing(false);
    }
  };

  const displayId = (row) =>
    row.user_id || row.wa_id || row.id || row.phone || '—';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Receipta Subscriptions</h1>
        <p className={styles.subtitle}>
          Live view of Receipta Ledgers subscribers. Workspace holds no local copy — every action calls Receipta.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Subscribers</h2>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className={styles.filter}
          >
            <option value="">All tiers</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </select>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No subscribers returned.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Ends</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const id = displayId(row);
                  return (
                    <tr
                      key={id}
                      className={selected === id ? styles.rowActive : undefined}
                    >
                      <td>{id}</td>
                      <td>{row.tier || row.plan || '—'}</td>
                      <td>
                        {row.is_blocked || row.blocked ? (
                          <span className={styles.badgeBad}>blocked</span>
                        ) : (
                          <span className={styles.badgeOk}>active</span>
                        )}
                      </td>
                      <td>{row.end_date || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => openDetail(id)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <section className={styles.card}>
          <h2>Manage — {selected}</h2>
          {detailLoading ? (
            <p className={styles.muted}>Loading detail…</p>
          ) : !detail ? (
            <p className={styles.muted}>No detail loaded.</p>
          ) : (
            <>
              <div className={styles.detailGrid}>
                <div>
                  <span className={styles.detailLabel}>Tier</span>
                  <span>{detail.tier || detail.plan || '—'}</span>
                </div>
                <div>
                  <span className={styles.detailLabel}>Blocked</span>
                  <span>
                    {detail.is_blocked || detail.blocked ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className={styles.detailLabel}>Start</span>
                  <span>{detail.start_date || '—'}</span>
                </div>
                <div>
                  <span className={styles.detailLabel}>End</span>
                  <span>{detail.end_date || '—'}</span>
                </div>
              </div>

              {detail.features_included && (
                <p className={styles.hint}>
                  Features: {Array.isArray(detail.features_included)
                    ? detail.features_included.join(', ')
                    : String(detail.features_included)}
                </p>
              )}

              <div className={styles.actions}>
                <div className={styles.actionBlock}>
                  <h3>Set tier</h3>
                  <div className={styles.inline}>
                    <select
                      value={tierValue}
                      onChange={(e) => setTierValue(e.target.value)}
                    >
                      <option value="basic">basic</option>
                      <option value="pro">pro</option>
                    </select>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={acting}
                      onClick={() =>
                        runAction(
                          () => setSubscriberTier(selected, tierValue),
                          `Tier set to ${tierValue}.`
                        )
                      }
                    >
                      Update tier
                    </button>
                  </div>
                </div>

                <div className={styles.actionBlock}>
                  <h3>Update dates</h3>
                  <div className={styles.inline}>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={acting || (!startDate && !endDate)}
                      onClick={() =>
                        runAction(
                          () =>
                            updateSubscriptionDates(selected, {
                              startDate: startDate || undefined,
                              endDate: endDate || undefined,
                            }),
                          'Dates updated.'
                        )
                      }
                    >
                      Save dates
                    </button>
                  </div>
                </div>

                <div className={styles.actionBlock}>
                  <h3>Block / unblock</h3>
                  <div className={styles.inline}>
                    <input
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Reason required to block"
                    />
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      disabled={acting || !blockReason.trim()}
                      onClick={() =>
                        runAction(
                          () => blockSubscriber(selected, blockReason.trim()),
                          'Subscriber blocked.'
                        )
                      }
                    >
                      Block
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      disabled={acting}
                      onClick={() =>
                        runAction(
                          () => unblockSubscriber(selected),
                          'Subscriber unblocked.'
                        )
                      }
                    >
                      Unblock
                    </button>
                  </div>
                </div>

                <div className={styles.actionBlock}>
                  <h3>Delete subscription</h3>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    disabled={acting}
                    onClick={() => {
                      if (
                        !window.confirm(
                          'Delete this subscription on Receipta? This cannot be undone from Workspace.'
                        )
                      )
                        return;
                      runAction(
                        () => deleteSubscriber(selected),
                        'Subscription deleted on Receipta.'
                      ).then(() => {
                        setSelected(null);
                        setDetail(null);
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
