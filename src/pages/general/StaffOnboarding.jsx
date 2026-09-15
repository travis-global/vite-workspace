// src/pages/general/StaffOnboarding.jsx

import { useEffect, useState } from 'react';
import { listRoles, onboardStaff } from '../../api/endpoints/staffOnboarding';
import styles from './StaffOnboarding.module.css';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
};

export default function StaffOnboarding() {
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [lastResult, setLastResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    listRoles()
      .then((res) => setRoles(res.data || []))
      .catch(() => setRoles([]));
  }, []);

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleRole = (roleId) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    setLastResult(null);
    try {
      const { data } = await onboardStaff({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        initialRoleIds: selectedRoles.length ? selectedRoles : undefined,
      });
      setForm(emptyForm);
      setSelectedRoles([]);
      setLastResult(data);
      if (data.welcome_email_sent) {
        setSuccessMsg('Staff created. Welcome email sent with temporary password.');
      } else {
        setSuccessMsg(
          data.warning ||
            'Staff created, but welcome email failed. Communicate credentials manually.'
        );
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Onboarding failed (admin only).');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Staff Onboarding</h1>
        <p className={styles.subtitle}>
          Create a staff account. A temporary password is emailed via the staff_welcome template — it is never returned in this API response.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>New staff member</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
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
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleForm}
              required
            />
          </label>
          <label>
            Phone <span className={styles.optional}>(optional)</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleForm}
            />
          </label>

          <div className={styles.rolesBlock}>
            <span className={styles.rolesLabel}>Initial roles (optional)</span>
            {roles.length === 0 ? (
              <p className={styles.muted}>
                No roles yet — create some under Roles Management first.
              </p>
            ) : (
              <div className={styles.roleGrid}>
                {roles.map((role) => (
                  <label key={role.role_id} className={styles.roleChip}>
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.role_id)}
                      onChange={() => toggleRole(role.role_id)}
                    />
                    {role.role_name}
                    {role.department ? (
                      <span className={styles.dept}> ({role.department})</span>
                    ) : null}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Creating…' : 'Create staff account'}
          </button>
        </form>
      </section>

      {lastResult && (
        <section className={styles.card}>
          <h2>Last created</h2>
          <p>
            <strong>{lastResult.full_name}</strong> · {lastResult.email}
          </p>
          <p className={styles.mono}>user_id: {lastResult.user_id}</p>
          <p>
            Welcome email:{' '}
            {lastResult.welcome_email_sent ? 'sent' : 'not sent'}
          </p>
          {lastResult.warning && (
            <p className={styles.warn}>{lastResult.warning}</p>
          )}
        </section>
      )}
    </div>
  );
}
