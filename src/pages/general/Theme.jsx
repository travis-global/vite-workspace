// src/pages/general/Theme.jsx

import { useEffect, useState } from 'react';
import { getMyTheme, setMyTheme } from '../../api/endpoints/theme';
import styles from './Theme.module.css';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
    // Optional: resolve system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
  try {
    localStorage.setItem('workspace_theme', theme);
  } catch {
    /* ignore */
  }
}

export default function Theme() {
  const [theme, setTheme] = useState('system');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    getMyTheme()
      .then((res) => {
        const t = res.data?.theme_preference || 'system';
        setTheme(t);
        applyTheme(t);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Failed to load theme.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (value) => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await setMyTheme(value);
      setTheme(value);
      applyTheme(value);
      setSuccessMsg('Theme saved: ' + value);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save theme.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Light / Dark Mode</h1>
        <p className={styles.subtitle}>
          Preference is stored on your account and follows you across devices.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : (
          <div className={styles.options}>
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={saving}
                className={
                  theme === opt.value ? styles.optionActive : styles.option
                }
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <p className={styles.hint}>
          Current: <strong>{theme}</strong>
          {saving ? ' · Saving…' : ''}
        </p>
      </section>
    </div>
  );
}
