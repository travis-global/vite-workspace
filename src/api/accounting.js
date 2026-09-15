import client from '../client';

export const getExpenses = (params = {}) => client.get('/accounting/expenses', { params });
export const createExpense = (data) => client.post('/accounting/expenses', data);
export const deleteExpense = (id) => client.delete(`/accounting/expenses/${id}`);
