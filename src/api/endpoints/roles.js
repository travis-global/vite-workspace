// src/api/endpoints/roles.js
// Backend: features/roles_management/routes.py

import client from '../client';

export function listRoles() {
  return client.get('/admin/roles');
}

export function createRole({ roleName, department }) {
  return client.post('/admin/roles', null, {
    params: {
      role_name: roleName,
      department: department,
    },
  });
}

export function deleteRole(roleId) {
  return client.delete('/admin/roles/' + roleId);
}

export function assignRole(roleId, userId) {
  return client.post('/admin/roles/' + roleId + '/users/' + userId);
}

export function unassignRole(roleId, userId) {
  return client.delete('/admin/roles/' + roleId + '/users/' + userId);
}

export function getUserRoles(userId) {
  return client.get('/admin/roles/users/' + userId);
}
