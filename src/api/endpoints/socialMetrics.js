// src/api/endpoints/socialMetrics.js
// Backend: features/social_metrics/routes.py

import client from '../client';

export function listMetrics({ platform, startDate, endDate } = {}) {
  return client.get('/marketing/social-metrics', {
    params: {
      platform: platform || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}

export function getPlatformSummary({ startDate, endDate } = {}) {
  return client.get('/marketing/social-metrics/summary', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}

export function logMetric({
  platform,
  date,
  postReference,
  contentCalendarEntryId,
  campaignId,
  likes,
  comments,
  shares,
  reach,
}) {
  return client.post('/marketing/social-metrics', null, {
    params: {
      platform: platform,
      date: date,
      post_reference: postReference || undefined,
      content_calendar_entry_id: contentCalendarEntryId || undefined,
      campaign_id: campaignId || undefined,
      likes: likes !== undefined && likes !== '' ? likes : 0,
      comments: comments !== undefined && comments !== '' ? comments : 0,
      shares: shares !== undefined && shares !== '' ? shares : 0,
      reach: reach !== undefined && reach !== '' ? reach : 0,
    },
  });
}
