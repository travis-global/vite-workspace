// src/api/endpoints/leads.js
// Backend: features/lead_management/routes.py

import client from '../client';

export function listLeads({ funnelStage, source, assignedTo } = {}) {
  return client.get('/marketing/leads', {
    params: {
      funnel_stage: funnelStage || undefined,
      source: source || undefined,
      assigned_to: assignedTo || undefined,
    },
  });
}

export function listHotLeads({ threshold = 20 } = {}) {
  return client.get('/marketing/leads/hot', {
    params: { threshold },
  });
}

export function getFunnelSummary() {
  return client.get('/marketing/leads/funnel-summary');
}

export function createLead({
  fullName,
  phone,
  email,
  source,
  assignedTo,
  notes,
}) {
  return client.post('/marketing/leads', null, {
    params: {
      full_name: fullName,
      phone: phone,
      email: email || undefined,
      source: source || undefined,
      assigned_to: assignedTo || undefined,
      notes: notes || undefined,
    },
  });
}

export function updateFunnelStage(leadId, newStage) {
  return client.post('/marketing/leads/' + leadId + '/stage', null, {
    params: { new_stage: newStage },
  });
}

export function logCall(leadId, { outcome, notes } = {}) {
  return client.post('/marketing/leads/' + leadId + '/calls', null, {
    params: {
      outcome: outcome,
      notes: notes || undefined,
    },
  });
}

export function addScore(leadId, { points, reason }) {
  return client.post('/marketing/leads/' + leadId + '/score', null, {
    params: {
      points: points,
      reason: reason,
    },
  });
}
