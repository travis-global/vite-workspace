// src/api/endpoints/financialReports.js
// Backend: features/financial_reports/routes.py

import client from '../client';

export function getPnl({ startDate, endDate } = {}) {
  return client.get('/accounting/reports/pnl', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}

export function getExpenseBreakdown({ startDate, endDate } = {}) {
  return client.get('/accounting/reports/expense-breakdown', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}
