// src/api/endpoints/virtualAccounts.js
// Backend: features/virtual_accounts/routes.py

import client from '../client';

export function listVirtualAccounts() {
  return client.get('/accounting/virtual-accounts');
}

export function getAccountHistory(accountKey) {
  return client.get(`/accounting/virtual-accounts/${accountKey}/history`);
}

export function updateAllocationPercentages(percentages) {
  // Body is the dict itself, e.g. { salary: 35, operating_expenses: 40, ... }
  return client.patch('/accounting/virtual-accounts/allocation-percentages', percentages);
}
