// src/pages/general/FeaturesAdmin.jsx

import { useEffect, useState } from 'react';
import { listRoles } from '../../api/endpoints/roles';
import {
  listAllFeatures,
  resyncFeatures,
  getFeaturesForRole,
  grantFeatureToRole,
  revokeFeatureFromRole,
  previewUserMenu,
} from '../../api/endpoints/featuresAdmin';
import styles from './FeaturesAdmin.module.css';

export default function FeaturesAdmin() {
  const [roles, setRoles] = useState([]);
  const [features, setFeatures] = useState([]);
  const [roleId, setRoleId] = useState('');
  const [grantedKeys, setGrantedKeys] = useState(new Set());
  const [previewUserId, setPreviewUserId] = useState('');
  const [previewMenu, setPreviewMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadBase = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, featRes] = await Promise.all([
        listRoles(),
        listAllFeatures({ activeOnly: true }),
      ]);
      setRoles(rolesRes.data || []);
      setFeatures(featRes.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (!roleId) {
      setGrantedKeys(new Set());
      return;
    }
    getFeaturesForRole(Number(roleId))
      .then((res) => {
        const keys = new Set(
          (res.data || []).map((f) => f.feature_key)
        );
        setGrantedKeys(keys);
      })
      .catch(() => setGrantedKeys(new Set()));
  }, [roleId]);

  const handleToggle = async (featureKey, currentlyOn) => {
    if (!roleId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (currentlyOn) {
        await revokeFeatureFromRole(Number(roleId), featureKey);
        setGrantedKeys((prev) => {
          const n = new Set(prev);
          n.delete(featureKey);
          return n;
        });
        setSuccessMsg('Revoked ' + featureKey);
      } else {
        await grantFeatureToRole(Number(roleId), featureKey);
        setGrantedKeys((prev) => new Set(prev).add(featureKey));
        setSuccessMsg('Granted ' + featureKey);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleResync = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const { data } = await resyncFeatures();
      setSuccessMsg(
        'Resync done. upserted=' +
          (data.upserted ?? data.synced ?? JSON.stringify(data))
      );
      await loadBase();
    } catch (err) {
      setError(err.response?.data?.detail || 'Resync failed.');
    }
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    try {
      const { data } = await previewUserMenu(previewUserId.trim());
      setPreviewMenu(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Preview failed.');
      setPreviewMenu([]);
    }
  };

  const byDept = {};
  features.forEach((f) => {
    const d = f.department || 'other';
    if (!byDept[d]) byDept[d] = [];
    byDept[d].push(f);
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Features Handling</h1>
        <p className={styles.subtitle}>
          Tick features onto a role. Users inherit the union of features from all their roles.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <label>
            Role
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              <option value="">Select role…</option>
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_id}>
                  {r.role_name} ({r.department})
                </option>
              ))}
            </select>
          </label>
          <button type="button" className={styles.secondaryBtn} onClick={handleResync}>
            Resync registry
          </button>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : !roleId ? (
          <p className={styles.muted}>Select a role to edit its features.</p>
        ) : (
          Object.keys(byDept)
            .sort()
            .map((dept) => (
              <div key={dept} className={styles.deptBlock}>
                <h3>{dept}</h3>
                <div className={styles.checkGrid}>
                  {byDept[dept].map((f) => {
                    const on = grantedKeys.has(f.feature_key);
                    return (
                      <label key={f.feature_key} className={styles.checkItem}>
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={saving}
                          onChange={() => handleToggle(f.feature_key, on)}
                        />
                        <span>
                          {f.display_name}
                          <span className={styles.key}> {f.feature_key}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))
        )}
      </section>

      <section className={styles.card}>
        <h2>Preview user menu</h2>
        <form className={styles.previewRow} onSubmit={handlePreview}>
          <input
            value={previewUserId}
            onChange={(e) => setPreviewUserId(e.target.value)}
            placeholder="user_id"
            required
          />
          <button type="submit" className={styles.primaryBtn}>
            Preview
          </button>
        </form>
        {previewMenu.length > 0 && (
          <ul className={styles.menuList}>
            {previewMenu.map((f) => (
              <li key={f.feature_key}>
                {f.display_name}{' '}
                <span className={styles.key}>{f.feature_key}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
