// src/api/endpoints/campaigns.js
// Backend: features/campaign_management/routes.py

import client from '../client';

export function listCampaigns({ status, channel } = {}) {
  return client.get('/marketing/campaigns', {
    params: {
      status: status || undefined,
      channel: channel || undefined,
    },
  });
}

export function getCampaign(campaignId) {
  return client.get('/marketing/campaigns/' + campaignId);
}

export function getCampaignPerformance(campaignId) {
  return client.get('/marketing/campaigns/' + campaignId + '/performance');
}

export function createCampaign({
  name,
  channel,
  leadMagnetId,
  startDate,
  endDate,
  budget,
}) {
  return client.post('/marketing/campaigns', null, {
    params: {
      name: name,
      channel: channel || undefined,
      lead_magnet_id: leadMagnetId || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      budget: budget !== undefined && budget !== '' ? budget : undefined,
    },
  });
}

export function updateCampaignStatus(campaignId, newStatus) {
  return client.post('/marketing/campaigns/' + campaignId + '/status', null, {
    params: { new_status: newStatus },
  });
}
