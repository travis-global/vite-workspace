// src/api/endpoints/leadMagnets.js
// Backend: features/lead_magnets/routes.py

import client from '../client';

export function listLeadMagnets() {
  return client.get('/marketing/lead-magnets');
}

export function getLeadMagnet(magnetId) {
  return client.get('/marketing/lead-magnets/' + magnetId);
}

export function getLeadMagnetPerformance(magnetId) {
  return client.get('/marketing/lead-magnets/' + magnetId + '/performance');
}

export function createLeadMagnet({ title, fileId, description, landingCopy }) {
  return client.post('/marketing/lead-magnets', null, {
    params: {
      title: title,
      file_id: fileId,
      description: description || undefined,
      landing_copy: landingCopy || undefined,
    },
  });
}

export function deleteLeadMagnet(magnetId) {
  return client.delete('/marketing/lead-magnets/' + magnetId);
}
