// src/api/endpoints/staffSecurity.js
// Backend: features/staff_account_security/routes.py

import client from '../client';

export function resetPassword(userId, reason) {
  return client.post('/staff-security/' + userId + '/reset-password', null, {
    params: { reason: reason },
  });
}

export function setAdminStatus(userId, { isAdmin, reason }) {
  return client.post('/staff-security/' + userId + '/set-admin', null, {
    params: {
      is_admin: isAdmin,
      reason: reason,
    },
  });
}
