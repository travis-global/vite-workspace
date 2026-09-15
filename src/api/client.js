// src/api/client.js
//
// One axios instance for the whole app. The Authorization header is
// attached automatically on every request via an interceptor — no
// individual API call ever needs to remember to add it. A 401
// response (invalid/expired/revoked token — see Workspace's real
// server-side logout/revocation) triggers a redirect to login and
// clears the stored token, rather than leaving the app in a broken
// half-authenticated state.

import axios from 'axios';

// Set VITE_API_BASE_URL in a .env file once app.py has a real host —
// defaults to localhost for local development against the Termux-
// hosted backend.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('workspace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('workspace_token');
      localStorage.removeItem('workspace_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
