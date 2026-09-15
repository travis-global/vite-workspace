// src/api/endpoints/revenue.js
//
// Thin wrappers around the shared client for Revenue Tracking.
// Backend: features/revenue_tracking/routes.py
// POST expects simple params (query-style), not a JSON body.

import client from '../client';

export function listRevenue({ source, startDate, endDate } = {}) {
  return client.get('/accounting/revenue', {
    params: {
      source: source || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}

export function addRevenue({ description, amount, date, source }) {
  // FastAPI declared these as plain function args on a POST route,
  // so they are query parameters — not a JSON body.
  return client.post('/accounting/revenue', null, {
    params: {
      description,
      amount,
      date,
      source: source || undefined,
    },
  });
}

export function deleteRevenue(revenueId) {
  return client.delete(`/accounting/revenue/${revenueId}`);
}

export function requestDeleteRevenue(revenueId) {
  return client.post(`/accounting/revenue/${revenueId}/request-delete`);
}

export function verifyDeleteRevenue(requestId, code) {
  return client.post(`/accounting/revenue/delete-requests/${requestId}/verify`, {
    code,
  });
}
