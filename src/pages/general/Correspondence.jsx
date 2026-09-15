// src/pages/general/Correspondence.jsx

import { useEffect, useState } from 'react';
import {
  listEmailTemplates,
  listLetterTemplates,
  reloadTemplates,
  sendEmail,
  getEmailLog,
  generateLetter,
} from '../../api/endpoints/correspondence';
import styles from './Correspondence.module.css';

export default function Correspondence() {
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [letterTemplates, setLetterTemplates] = useState([]);
  const [log, setLog] = useState([]);

  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    templateKey: '',
    fieldsJson: '{\n  "recipient_name": ""\n}',
  });
  const [letterForm, setLetterForm] = useState({
    recipientName: '',
    recipientAddress: '',
    templateKey: '',
    fieldsJson: '{\n  "recipient_name": ""\n}',
  });

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setError(null);
    try {
      const [e, l, logRes] = await Promise.all([
        listEmailTemplates(),
        listLetterTemplates(),
        getEmailLog(),
      ]);
      setEmailTemplates(e.data || []);
      setLetterTemplates(l.data || []);
      setLog(logRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load correspondence data.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const parseFields = (jsonStr) => {
    try {
      return JSON.parse(jsonStr || '{}');
    } catch {
      throw new Error('Fields must be valid JSON.');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const fields = parseFields(emailForm.fieldsJson);
      await sendEmail({
        recipientEmail: emailForm.recipientEmail.trim(),
        templateKey: emailForm.templateKey,
        fields,
      });
      setSuccessMsg('Email sent.');
      await load();
    } catch (err) {
      setError(
        err.message === 'Fields must be valid JSON.'
          ? err.message
          : err.response?.data?.detail || 'Send failed (SMTP may be deferred).'
      );
    } finally {
      setSending(false);
    }
  };

  const handleLetter = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const fields = parseFields(letterForm.fieldsJson);
      const { data } = await generateLetter({
        templateKey: letterForm.templateKey,
        recipientName: letterForm.recipientName.trim(),
        recipientAddress: letterForm.recipientAddress.trim() || undefined,
        fields,
      });
      setSuccessMsg(
        'Letter PDF saved to File Library. file_id: ' + (data.file_id || '')
      );
    } catch (err) {
      setError(
        err.message === 'Fields must be valid JSON.'
          ? err.message
          : err.response?.data?.detail || 'Generate failed.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleReload = async () => {
    try {
      await reloadTemplates();
      setSuccessMsg('Templates reloaded from disk.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Reload failed.');
    }
  };

  const tplKey = (t) => t.template_key || t.key || t.name;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Emailing &amp; Letters</h1>
        <p className={styles.subtitle}>
          Send branded template emails, or generate printable letter PDFs into File Library.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <div className={styles.toolbar}>
        <button type="button" className={styles.secondaryBtn} onClick={handleReload}>
          Reload templates
        </button>
      </div>

      <section className={styles.card}>
        <h2>Send email</h2>
        <form className={styles.form} onSubmit={handleSend}>
          <label>
            Recipient email
            <input
              type="email"
              value={emailForm.recipientEmail}
              onChange={(e) =>
                setEmailForm((p) => ({ ...p, recipientEmail: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Template
            <select
              value={emailForm.templateKey}
              onChange={(e) =>
                setEmailForm((p) => ({ ...p, templateKey: e.target.value }))
              }
              required
            >
              <option value="">Select…</option>
              {emailTemplates.map((t) => (
                <option key={tplKey(t)} value={tplKey(t)}>
                  {t.name || tplKey(t)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.full}>
            Fields (JSON)
            <textarea
              value={emailForm.fieldsJson}
              onChange={(e) =>
                setEmailForm((p) => ({ ...p, fieldsJson: e.target.value }))
              }
              rows={6}
              spellCheck={false}
            />
          </label>
          <button type="submit" disabled={sending} className={styles.primaryBtn}>
            {sending ? 'Sending…' : 'Send email'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Generate letter PDF</h2>
        <form className={styles.form} onSubmit={handleLetter}>
          <label>
            Recipient name
            <input
              value={letterForm.recipientName}
              onChange={(e) =>
                setLetterForm((p) => ({ ...p, recipientName: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Template
            <select
              value={letterForm.templateKey}
              onChange={(e) =>
                setLetterForm((p) => ({ ...p, templateKey: e.target.value }))
              }
              required
            >
              <option value="">Select…</option>
              {letterTemplates.map((t) => (
                <option key={tplKey(t)} value={tplKey(t)}>
                  {t.name || tplKey(t)}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.full}>
            Address <span className={styles.optional}>(optional)</span>
            <input
              value={letterForm.recipientAddress}
              onChange={(e) =>
                setLetterForm((p) => ({
                  ...p,
                  recipientAddress: e.target.value,
                }))
              }
            />
          </label>
          <label className={styles.full}>
            Fields (JSON)
            <textarea
              value={letterForm.fieldsJson}
              onChange={(e) =>
                setLetterForm((p) => ({ ...p, fieldsJson: e.target.value }))
              }
              rows={6}
              spellCheck={false}
            />
          </label>
          <button type="submit" disabled={generating} className={styles.primaryBtn}>
            {generating ? 'Generating…' : 'Generate letter'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Email log</h2>
        {log.length === 0 ? (
          <p className={styles.muted}>No sends logged.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Template</th>
                </tr>
              </thead>
              <tbody>
                {log.map((row, i) => (
                  <tr key={row.log_id || i}>
                    <td>{row.recipient_email}</td>
                    <td>{row.subject}</td>
                    <td>{row.status}</td>
                    <td>{row.template_key || '—'}</td>
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
