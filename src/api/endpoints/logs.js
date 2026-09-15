// src/api/endpoints/logs.js
// Backend: features/log_monitor_system/routes.py

import client from '../client';

export function listLogs({
  userId,
  featureKey,
  action,
  targetType,
  startDate,
  endDate,
  limit = 100,
} = {}) {
  return client.get('/logs', {
    params: {
      user_id: userId || undefined,
      feature_key: featureKey || undefined,
      action: action || undefined,
      target_type: targetType || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      limit: limit,
    },
  });
}

export function getTargetHistory(targetType, targetId) {
  return client.get('/logs/target/' + targetType + '/' + targetId);
}
