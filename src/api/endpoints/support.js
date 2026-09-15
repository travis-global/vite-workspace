// src/api/endpoints/support.js
// Backend: features/customer_rep_chat_system/routes.py

import client from '../client';

export function setAvailability(isAvailable) {
  return client.post('/support/csp/availability', null, {
    params: { is_available: isAvailable },
  });
}

export function getMyTicket() {
  return client.get('/support/tickets/mine');
}

export function listPendingTickets() {
  return client.get('/support/tickets/pending');
}

export function getTicket(ticketId) {
  return client.get('/support/tickets/' + ticketId);
}

export function claimTicket(ticketId) {
  return client.post('/support/tickets/' + ticketId + '/claim');
}

export function sendOutreachTemplate(ticketId) {
  return client.post('/support/tickets/' + ticketId + '/send-template');
}

export function respondToTicket(ticketId, { contentType = 'text', contentText, file } = {}) {
  const form = new FormData();
  form.append('content_type', contentType);
  if (contentText) form.append('content_text', contentText);
  if (file) form.append('file', file);
  return client.post('/support/tickets/' + ticketId + '/respond', form);
}

export function closeTicket(ticketId) {
  return client.post('/support/tickets/' + ticketId + '/close');
}
