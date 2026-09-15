// src/api/endpoints/staffOnboarding.js
// Backend: features/staff_onboarding/routes.py

import client from '../client';

export function listRoles() {
  return client.get('/admin/roles');
}

export function onboardStaff({ fullName, email, phone, initialRoleIds }) {
  return client.post(
    '/admin/staff',
    initialRoleIds && initialRoleIds.length ? initialRoleIds : null,
    {
      params: {
        full_name: fullName,
        email: email,
        phone: phone || undefined,
      },
    }
  );
}
