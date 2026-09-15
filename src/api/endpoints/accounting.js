import client from '../client';

export const getExpenses = (params = {}) => client.get('/accounting/expenses', { params });
export const createExpense = (data) => client.post('/accounting/expenses', data);
export const deleteExpense = (id) => client.delete(`/accounting/expenses/${id}`);


// --- dual-control delete (expenses) ---
export function requestDeleteExpense(expenseId) {
  return client.post(`/accounting/expenses/${expenseId}/request-delete`);
}

export function verifyDeleteExpense(requestId, code) {
  return client.post(
    `/accounting/expenses/delete-requests/${requestId}/verify`,
    { code }
  );
}

// --- dual-control delete (revenue) ---
export function requestDeleteRevenue(revenueId) {
  return client.post(`/accounting/revenue/${revenueId}/request-delete`);
}

export function verifyDeleteRevenue(requestId, code) {
  return client.post(
    `/accounting/revenue/delete-requests/${requestId}/verify`,
    { code }
  );
}
