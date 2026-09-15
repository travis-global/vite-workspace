// src/pages/customer_rep/Support.jsx

import { useEffect, useState } from 'react';
import {
  setAvailability,
  getMyTicket,
  listPendingTickets,
  getTicket,
  claimTicket,
  sendOutreachTemplate,
  respondToTicket,
  closeTicket,
} from '../../api/endpoints/support';
import styles from './Support.module.css';

export default function Support() {
  const [available, setAvailable] = useState(true);
  const [mine, setMine] = useState(null);
  const [pending, setPending] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [mineRes, pendRes] = await Promise.all([
        getMyTicket(),
        listPendingTickets(),
      ]);
      setMine(mineRes.data);
      setPending(pendRes.data || []);
      if (mineRes.data?.ticket_id && !activeId) {
        setActiveId(mineRes.data.ticket_id);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load support desk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      return;
    }
    getTicket(activeId)
      .then((res) => setDetail(res.data))
      .catch((err) =>
        setError(err.response?.data?.detail || 'Failed to load ticket.')
      );
  }, [activeId]);

  const handleAvailability = async () => {
    const next = !available;
    try {
      await setAvailability(next);
      setAvailable(next);
      setSuccessMsg(next ? 'You are available for new tickets.' : 'You are unavailable.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not update availability.');
    }
  };

  const handleClaim = async (ticketId) => {
    try {
      await claimTicket(ticketId);
      setSuccessMsg('Ticket claimed.');
      setActiveId(ticketId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Claim failed.');
    }
  };

  const handleTemplate = async () => {
    if (!activeId) return;
    try {
      await sendOutreachTemplate(activeId);
      setSuccessMsg('Outreach template sent (or queued).');
      const { data } = await getTicket(activeId);
      setDetail(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Template send failed (WhatsApp / template env may be deferred).'
      );
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!activeId || !reply.trim()) return;
    try {
      await respondToTicket(activeId, {
        contentType: 'text',
        contentText: reply.trim(),
      });
      setReply('');
      setSuccessMsg('Reply saved.');
      const { data } = await getTicket(activeId);
      setDetail(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Reply failed (24h window may require template first).'
      );
    }
  };

  const handleClose = async () => {
    if (!activeId) return;
    if (!window.confirm('Close this ticket?')) return;
    try {
      await closeTicket(activeId);
      setSuccessMsg('Ticket closed.');
      setActiveId(null);
      setDetail(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Close failed.');
    }
  };

  const messages = detail?.messages || detail?.thread || [];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Customer Support</h1>
        <p className={styles.subtitle}>
          CSP desk — availability, claim queue, template outreach, free-form reply after window opens.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <div className={styles.toolbar}>
        <button type="button" className={styles.secondaryBtn} onClick={handleAvailability}>
          {available ? 'Go unavailable' : 'Go available'}
        </button>
        <button type="button" className={styles.secondaryBtn} onClick={load}>
          Refresh
        </button>
      </div>

      <div className={styles.layout}>
        <aside className={styles.side}>
          <section className={styles.card}>
            <h2>My ticket</h2>
            {loading ? (
              <p className={styles.muted}>Loading…</p>
            ) : !mine ? (
              <p className={styles.muted}>None assigned.</p>
            ) : (
              <button
                type="button"
                className={styles.ticketBtn}
                onClick={() => setActiveId(mine.ticket_id)}
              >
                {mine.ticket_id}
                <span className={styles.sub}>{mine.status}</span>
              </button>
            )}
          </section>

          <section className={styles.card}>
            <h2>Pending queue</h2>
            {pending.length === 0 ? (
              <p className={styles.muted}>Empty.</p>
            ) : (
              <ul className={styles.list}>
                {pending.map((t) => (
                  <li key={t.ticket_id}>
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => setActiveId(t.ticket_id)}
                    >
                      {t.ticket_id}
                    </button>
                    {' · '}
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      onClick={() => handleClaim(t.ticket_id)}
                    >
                      Claim
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <main className={styles.main}>
          {!detail ? (
            <p className={styles.muted}>Select a ticket.</p>
          ) : (
            <>
              <div className={styles.mainHead}>
                <div>
                  <h2>{detail.ticket_id}</h2>
                  <p className={styles.meta}>
                    Status: {detail.status}
                    {detail.customer_wa_id
                      ? ' · WA: ' + detail.customer_wa_id
                      : ''}
                    {detail.assigned_to
                      ? ' · CSP: ' + detail.assigned_to
                      : ''}
                  </p>
                </div>
                <div className={styles.actions}>
                  <button type="button" className={styles.secondaryBtn} onClick={handleTemplate}>
                    Send outreach template
                  </button>
                  <button type="button" className={styles.dangerBtn} onClick={handleClose}>
                    Close
                  </button>
                </div>
              </div>

              <div className={styles.thread}>
                {messages.length === 0 ? (
                  <p className={styles.muted}>No messages yet.</p>
                ) : (
                  messages.map((m, i) => (
                    <div
                      key={m.message_id || i}
                      className={
                        m.direction === 'outbound' ? styles.msgOut : styles.msgIn
                      }
                    >
                      <div className={styles.msgMeta}>
                        {m.direction} · {m.content_type}
                        {m.created_at ? ' · ' + m.created_at : ''}
                      </div>
                      <div>{m.content_text || m.content || '[media]'}</div>
                    </div>
                  ))
                )}
              </div>

              <form className={styles.composer} onSubmit={handleRespond}>
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply (text) — may need template first if 24h window closed"
                  required
                />
                <button type="submit" className={styles.primaryBtn}>
                  Send
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
