// src/api/endpoints/expenses.js

import client from '../client';

export function listExpenses({ category, startDate, endDate } = {}) {
  return client.get('/accounting/expenses', {
    params: {
      category: category || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}

/**
 * Backend expects JSON body (ExpenseCreate):
 * { description, amount, date, category?, receipt_file_id? }
 */
export function createExpense(payload) {
  return client.post('/accounting/expenses', payload);
}

/** Director dual-control — step 1 */
export function requestDeleteExpense(expenseId) {
  return client.post(`/accounting/expenses/${expenseId}/request-delete`);
}

/**
 * Director dual-control — step 2
 * Body: { code: "123456" }
 */
export function verifyDeleteExpense(requestId, code) {
  return client.post(
    `/accounting/expenses/delete-requests/${requestId}/verify`,
    { code }
  );
}
