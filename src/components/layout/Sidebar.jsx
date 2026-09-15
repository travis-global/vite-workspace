// src/components/layout/Sidebar.jsx
//
// Renders EXCLUSIVELY from useAuth().menu — the response of GET
// /me/menu. There is no hardcoded feature list here. If a role
// doesn't have a feature ticked on the backend, its nav item simply
// never exists in this component's render output — not hidden via
// CSS, genuinely never rendered, matching the backend's own
// "the frontend never even sees what it can't use" design.

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Sidebar.module.css';

// Maps a feature_key to a route path and icon. Universal items
// (Notifications, Chat, My Tasks) aren't gated by the menu at all —
// every logged-in user gets them, so they're listed here directly
// rather than depending on a menu entry.
const FEATURE_ROUTES = {
  general_chat_system: { path: '/chat', icon: '\u{1F4AC}' },
  task_submission_system: { path: '/tasks/mine', icon: '\u2705' },
  notification_system: { path: '/notifications', icon: '\u{1F514}' },

  expense_tracking: { path: '/accounting/expenses', icon: '\u{1F4B5}' },
  revenue_tracking: { path: '/accounting/revenue', icon: '\u{1F4C8}' },
  vendor_subscriptions: { path: '/accounting/vendor-subscriptions', icon: '\u{1F4E6}' },
  invoicing: { path: '/accounting/invoices', icon: '\u{1F9FE}' },
  virtual_accounts: { path: '/accounting/virtual-accounts', icon: '\u{1F4B3}' },
  financial_reports: { path: '/accounting/reports', icon: '\u{1F4CB}' },
  finance_disbursement: { path: '/accounting/disbursements', icon: '\u{1F3E6}' },
  receipta_subscriptions_management: { path: '/accounting/receipta-subscriptions', icon: '\u{1F4C3}' },
  salary_payment_system: { path: '/accounting/salary', icon: '\u{1F4B0}' },

  content_calendar_system: { path: '/marketing/calendar', icon: '\u{1F4C5}' },
  lead_management: { path: '/marketing/leads', icon: '\u{1F3AF}' },
  lead_magnets: { path: '/marketing/lead-magnets', icon: '\u{1F4E6}' },
  campaign_management: { path: '/marketing/campaigns', icon: '\u{1F4CA}' },
  social_metrics: { path: '/marketing/social-metrics', icon: '\u{1F4F1}' },
  marketing_analytics: { path: '/marketing/analytics', icon: '\u{1F4C8}' },

  file_library_system: { path: '/files', icon: '\u{1F4C1}' },
  meeting_scheduling_system: { path: '/meetings', icon: '\u{1F4C5}' },
  task_assignment_system: { path: '/tasks', icon: '\u{1F4DD}' },
  password_account_management: { path: '/vault', icon: '\u{1F511}' },
  staff_management: { path: '/staff', icon: '\u{1F465}' },
  staff_onboarding: { path: '/staff/onboarding', icon: '\u{1F44B}' },
  roles_management: { path: '/roles', icon: '\u{1F511}' },
  features_management: { path: '/admin/features', icon: '\u2699' },
  emailing_letter_system: { path: '/correspondence', icon: '\u{1F4E7}' },
  worker_query_system: { path: '/worker-queries', icon: '\u{1F4AC}' },
  customer_rep_chat_system: { path: '/support', icon: '\u{1F3E2}' },
  customer_rep_management: { path: '/support/reps', icon: '\u{1F464}' },
  log_monitor_system: { path: '/logs', icon: '\u{1F4DC}' },
  staff_account_security: { path: '/security', icon: '\u{1F6E1}' },
  theme_preference: { path: '/theme', icon: '\u{1F319}' },
  staff_directory: { path: '/directory', icon: '\u{1F4CB}' },
  ai_usage_monitor: { path: '/ai-usage', icon: '\u{1F4CA}' },
};

export default function Sidebar({ collapsed, onToggle }) {
  const { menu } = useAuth();
  const location = useLocation();

  // Group the flat menu list by department, same structural device as
  // the mockup — this isn't decoration, it mirrors the real backend
  // permission model (features are tagged by department there too).
  const grouped = menu.reduce((acc, feature) => {
    const dept = feature.department || 'general';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(feature);
    return acc;
  }, {});

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.logoMark}>R</div>
        {!collapsed && <span className={styles.brandName}>Workspace</span>}
      </div>

      <Link to="/" className={`${styles.navItem} ${isActive('/') && location.pathname === '/' ? styles.active : ''}`}>
        <span className={styles.icon}>&#8962;</span>
        {!collapsed && <span>Dashboard</span>}
      </Link>

      {Object.entries(grouped).map(([department, features]) => {
        const mappedFeatures = features.filter((f) => FEATURE_ROUTES[f.feature_key]);
        if (mappedFeatures.length === 0) return null; // don't show an empty section header
      
        return (
          <div key={department}>
            {!collapsed && <div className={styles.sectionLabel}>{department.toUpperCase()}</div>}
            {mappedFeatures.map((feature) => {
              const route = FEATURE_ROUTES[feature.feature_key];
              return (
                <Link
                  key={feature.feature_key}
                  to={route.path}
                  className={`${styles.navItem} ${isActive(route.path) ? styles.active : ''}`}
                >
                  <span className={styles.icon}>{route.icon}</span>
                  {!collapsed && <span>{feature.display_name}</span>}
                </Link>
              );
            })}
          </div>
        );
      })}

      <div className={styles.footer}>
        <button className={styles.collapseBtn} onClick={onToggle}>
          <span className={styles.icon}>&#8646;</span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
