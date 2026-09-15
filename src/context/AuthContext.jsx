// src/context/AuthContext.jsx
//
// The single source of truth for "who is logged in" and "what can
// they see." menu comes straight from GET /me/menu — the sidebar
// never hardcodes what features exist, it renders exactly this list.
// This is the frontend half of the whole "add a role, tick a
// checkbox, they see exactly that and nothing else" design promise.

import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    const token = localStorage.getItem('workspace_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [meResponse, menuResponse] = await Promise.all([
        client.get('/auth/me'),
        client.get('/me/menu'),
      ]);
      setUser(meResponse.data);
      setMenu(menuResponse.data);
    } catch {
      // client.js's interceptor already handles the redirect-to-login
      // on a genuine 401 — nothing extra needed here.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (email, password) => {
    const response = await client.post('/auth/login', { email, password });
    localStorage.setItem('workspace_token', response.data.access_token);
    setUser(response.data.user);

    const menuResponse = await client.get('/me/menu');
    setMenu(menuResponse.data);

    return response.data.user;
  };

  const logout = async () => {
    try {
      // Real server-side revocation (see auth.py's /auth/logout) — not
      // just discarding the local token. Best-effort: even if this
      // call fails, we still clear local state below so the person
      // isn't stuck "logged in" on this device.
      await client.post('/auth/logout');
    } catch {
      // Ignore — see comment above.
    }
    localStorage.removeItem('workspace_token');
    localStorage.removeItem('workspace_user');
    setUser(null);
    setMenu([]);
  };

  return (
    <AuthContext.Provider value={{ user, menu, loading, login, logout, refreshSession: loadSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
