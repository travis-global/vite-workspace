// src/components/layout/Topbar.jsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={styles.topbar}>
      <input
        className={styles.search}
        placeholder="Search Workspace..."
        disabled
      />

      <div className={styles.right}>
        <Link
          to="/notifications"
          className={styles.bell}
          title="Notifications"
        >
          &#128276;
          {unreadCount > 0 && (
            <span className={styles.badge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div
          className={styles.userChip}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <div className={styles.avatar}>{initials}</div>
          <span className={styles.userName}>
            {user?.full_name || 'Loading...'}
          </span>

          {menuOpen && (
            <div className={styles.dropdown}>
              <button
                type="button"
                onClick={handleLogout}
                className={styles.dropdownItem}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
