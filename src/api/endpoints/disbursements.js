// src/api/endpoints/disbursements.js
// Backend: features/finance_disbursement/routes.py
// POST / verify use query params.

import client from '../client';

export function listDisbursements({ status } = {}) {
  return client.get('/disbursements', {
    params: { status: status || undefined },
  });
}

export function getDisbursement(requestId) {
  return client.get(`/disbursements/${requestId}`);
}

export function requestDisbursement({
  purpose,
  recipientName,
  recipientAccountNumber,
  recipientBankCode,
  amount,
  sourceAccount = 'operating_expenses',
}) {
  return client.post('/disbursements', null, {
    params: {
      purpose,
      recipient_name: recipientName,
      recipient_account_number: recipientAccountNumber,
      recipient_bank_code: recipientBankCode,
      amount,
      source_account: sourceAccount,
    },
  });
}

export function verifyDisbursement(requestId, code) {
  return client.post(`/disbursements/${requestId}/verify`, null, {
    params: { code },
  });
}
