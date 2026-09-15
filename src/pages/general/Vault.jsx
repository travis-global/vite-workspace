// src/pages/general/Vault.jsx

import { useEffect, useState } from 'react';
import {
  listVaultAccounts,
  addVaultAccount,
  deleteVaultAccount,
  requestVaultAccess,
  verifyVaultAccess,
} from '../../api/endpoints/vault';
import styles from './Vault.module.css';

const emptyForm = {
  accountName: '',
  email: '',
  password: '',
  service: '',
  project: '',
};

export default function Vault() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [projectFilter, setProjectFilter] = useState('');
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listVaultAccounts({
        project: projectFilter || undefined,
      });
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load vault.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [projectFilter]);

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await addVaultAccount({
        accountName: form.accountName.trim(),
        email: form.email.trim(),
        password: form.password,
        service: form.service.trim() || undefined,
        project: form.project.trim() || undefined,
      });
      setForm(emptyForm);
      setSuccessMsg('Account stored (encrypted).');
      await load();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Failed to add account (check VAULT_ENCRYPTION_KEY).'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (accountId) => {
    if (!window.confirm('Delete this vault account?')) return;
    try {
      await deleteVaultAccount(accountId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed.');
    }
  };

  const handleRequest = async (accountId) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const { data } = await requestVaultAccess(accountId);
      setPendingRequestId(data.request_id);
      setCode('');
      setSuccessMsg(data.message);
    } catch (err) {
      setError(err.response?.data?.detail || 'Request failed.');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!pendingRequestId) return;
    setVerifying(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { data } = await verifyVaultAccess(pendingRequestId, code.trim());
      setSuccessMsg(
        data.message ||
          'Details sent to your notifications (not shown on this page).'
      );
      setPendingRequestId(null);
      setCode('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Password Vault</h1>
        <p className={styles.subtitle}>
          Store credentials encrypted. To reveal: request access → Director gets a one-time code → enter code → password arrives in Notifications only.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>Add account</h2>
        <form className={styles.form} onSubmit={handleAdd}>
          <label>
            Account name
            <input
              name="accountName"
              value={form.accountName}
              onChange={handleForm}
              required
              placeholder="e.g. Company Instagram"
            />
          </label>
          <label>
            Email / username
            <input
              name="email"
              value={form.email}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleForm}
              required
              autoComplete="new-password"
            />
          </label>
          <label>
            Service <span className={styles.optional}>(optional)</span>
            <input
              name="service"
              value={form.service}
              onChange={handleForm}
              placeholder="Instagram, Gmail…"
            />
          </label>
          <label>
            Project <span className={styles.optional}>(optional)</span>
            <input
              name="project"
              value={form.project}
              onChange={handleForm}
            />
          </label>
          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Saving…' : 'Store encrypted'}
          </button>
        </form>
      </section>

      {pendingRequestId && (
        <section className={styles.verifyCard}>
          <h2>Enter Director code</h2>
          <p className={styles.hint}>
            Request <code>{pendingRequestId}</code>. After a valid code, the password is sent to your notifications — it will not appear here.
          </p>
          <form className={styles.verifyForm} onSubmit={handleVerify}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="One-time code"
              required
              autoComplete="one-time-code"
            />
            <button type="submit" disabled={verifying} className={styles.primaryBtn}>
              {verifying ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                setPendingRequestId(null);
                setCode('');
              }}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Accounts (metadata only)</h2>
          <input
            className={styles.filter}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            placeholder="Filter project"
          />
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No accounts yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Service</th>
                  <th>Project</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.account_id}>
                    <td>{row.account_name}</td>
                    <td>{row.email}</td>
                    <td>{row.service || '—'}</td>
                    <td>{row.project || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() => handleRequest(row.account_id)}
                      >
                        Request access
                      </button>
                      {' · '}
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(row.account_id)}
                      >
                        Delete
                      </button>
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
