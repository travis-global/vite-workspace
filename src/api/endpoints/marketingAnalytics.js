// src/api/endpoints/marketingAnalytics.js
// Backend: features/marketing_analytics/routes.py

import client from '../client';

export function getOverview({ startDate, endDate } = {}) {
  return client.get('/marketing/analytics/overview', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}
