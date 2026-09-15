// src/pages/Dashboard.jsx

import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, menu } = useAuth();
  const [pnl, setPnl] = useState(null);

  useEffect(() => {
    // Only fetch financial data if this user's menu actually includes
    // financial_reports — otherwise the request would just 403,
    // which is expected/correct, not an error to surface to them.
    const hasFinancialReports = menu.some((f) => f.feature_key === 'financial_reports');
    if (!hasFinancialReports) return;

    client.get('/accounting/reports/pnl')
      .then((res) => setPnl(res.data))
      .catch(() => {
        // Silently skip — the KPI cards just don't render without data.
      });
  }, [menu]);

  const firstName = user?.full_name?.split(' ')[0] || '';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      <div className={styles.header}>
        <h1>{greeting}, {firstName}</h1>
        <p>Here's where things stand today.</p>
      </div>

      {pnl && (
        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Revenue</div>
            <div className={`${styles.kpiValue} money`}>
              <span className="symbol">&#8358;</span>{pnl.revenue.toLocaleString()}
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Expenses</div>
            <div className={`${styles.kpiValue} money`}>
              <span className="symbol">&#8358;</span>{pnl.expenses.toLocaleString()}
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Net Profit</div>
            <div className={`${styles.kpiValue} money`}>
              <span className="symbol">&#8358;</span>{pnl.net_profit.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
