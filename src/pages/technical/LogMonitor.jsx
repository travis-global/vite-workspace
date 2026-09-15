// src/pages/technical/LogMonitor.jsx

import { useEffect, useState } from 'react';
import { listLogs, getTargetHistory } from '../../api/endpoints/logs';
import styles from './LogMonitor.module.css';

export default function LogMonitor() {
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    userId: '',
    featureKey: '',
    action: '',
    targetType: '',
    startDate: '',
    endDate: '',
  });
  const [targetType, setTargetType] = useState('');
  const [targetId, setTargetId] = useState('');
  const [trail, setTrail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listLogs({
        userId: filters.userId || undefined,
        featureKey: filters.featureKey || undefined,
        action: filters.action || undefined,
        targetType: filters.targetType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: 100,
      });
      setRows(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFilter = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
  };

  const handleTrail = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const { data } = await getTargetHistory(
        targetType.trim(),
        targetId.trim()
      );
      setTrail(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load target history.');
      setTrail([]);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Log Monitor</h1>
        <p className={styles.subtitle}>
          Audit trail — metadata only (no vault passwords or HR letter bodies).
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.card}>
        <div className={styles.filters}>
          <input
            name="userId"
            value={filters.userId}
            onChange={handleFilter}
            placeholder="user_id"
          />
          <input
            name="featureKey"
            value={filters.featureKey}
            onChange={handleFilter}
            placeholder="feature_key"
          />
          <input
            name="action"
            value={filters.action}
            onChange={handleFilter}
            placeholder="action"
          />
          <input
            name="targetType"
            value={filters.targetType}
            onChange={handleFilter}
            placeholder="target_type"
          />
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilter}
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilter}
          />
          <button type="button" className={styles.primaryBtn} onClick={load}>
            Apply
          </button>
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No log rows.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Feature</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.log_id || i}>
                    <td>{row.created_at}</td>
                    <td className={styles.mono}>{row.user_id}</td>
                    <td>{row.feature_key}</td>
                    <td>{row.action}</td>
                    <td className={styles.mono}>
                      {row.target_type}
                      {row.target_id ? ':' + row.target_id : ''}
                    </td>
                    <td className={styles.detail}>
                      {typeof row.detail === 'string'
                        ? row.detail
                        : JSON.stringify(row.detail || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2>Target history</h2>
        <form className={styles.filters} onSubmit={handleTrail}>
          <input
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            placeholder="target_type e.g. file"
            required
          />
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="target_id"
            required
          />
          <button type="submit" className={styles.primaryBtn}>
            Load trail
          </button>
        </form>
        {trail.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {trail.map((row, i) => (
                  <tr key={row.log_id || i}>
                    <td>{row.created_at}</td>
                    <td className={styles.mono}>{row.user_id}</td>
                    <td>{row.action}</td>
                    <td className={styles.detail}>
                      {typeof row.detail === 'string'
                        ? row.detail
                        : JSON.stringify(row.detail || {})}
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
