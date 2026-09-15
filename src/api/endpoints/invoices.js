// src/api/endpoints/invoices.js
// Backend: features/invoicing/routes.py
// POST: scalars as query params, line_items as JSON body (raw array).

import client from '../client';

export function listInvoices({ status } = {}) {
  return client.get('/accounting/invoices', {
    params: { status: status || undefined },
  });
}

export function createAndSendInvoice({
  clientName,
  clientEmail,
  lineItems,
  dueDate,
}) {
  return client.post('/accounting/invoices', lineItems, {
    params: {
      client_name: clientName,
      client_email: clientEmail,
      due_date: dueDate || undefined,
    },
  });
}
