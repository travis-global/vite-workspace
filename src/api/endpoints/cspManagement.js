// src/api/endpoints/cspManagement.js
// Backend: features/customer_rep_management/routes.py

import client from '../client';

export function getTeamStatus() {
  return client.get('/csp-management/team-status');
}

export function getCspStats(userId) {
  return client.get('/csp-management/csp/' + userId + '/stats');
}

export function reassignTicket(ticketId, { newCspId, reason }) {
  return client.post('/csp-management/tickets/' + ticketId + '/reassign', null, {
    params: {
      new_csp_id: newCspId,
      reason: reason,
    },
  });
}
