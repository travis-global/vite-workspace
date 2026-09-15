// src/api/endpoints/featuresAdmin.js
// Backend: features/features_management/routes.py

import client from '../client';

export function listAllFeatures({ activeOnly = true } = {}) {
  return client.get('/admin/features', {
    params: { active_only: activeOnly },
  });
}

export function resyncFeatures() {
  return client.post('/admin/features/resync');
}

export function getFeaturesForRole(roleId) {
  return client.get('/admin/features/roles/' + roleId);
}

export function grantFeatureToRole(roleId, featureKey) {
  return client.post('/admin/features/roles/' + roleId + '/' + featureKey);
}

export function revokeFeatureFromRole(roleId, featureKey) {
  return client.delete('/admin/features/roles/' + roleId + '/' + featureKey);
}

export function previewUserMenu(userId) {
  return client.get('/admin/features/users/' + userId + '/menu');
}
