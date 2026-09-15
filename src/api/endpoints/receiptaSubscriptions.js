// src/api/endpoints/receiptaSubscriptions.js
// Backend: features/receipta_subscriptions_management/routes.py
// All mutating calls use query params (not JSON body).

import client from '../client';

export function listSubscribers({ tier } = {}) {
  return client.get('/receipta-subscriptions', {
    params: { tier: tier || undefined },
  });
}

export function getSubscriber(userId) {
  return client.get(`/receipta-subscriptions/${userId}`);
}

export function setSubscriberTier(userId, tier) {
  return client.post(`/receipta-subscriptions/${userId}/tier`, null, {
    params: { tier },
  });
}

export function updateSubscriptionDates(userId, { startDate, endDate } = {}) {
  return client.patch(`/receipta-subscriptions/${userId}/dates`, null, {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}

export function blockSubscriber(userId, reason) {
  return client.post(`/receipta-subscriptions/${userId}/block`, null, {
    params: { reason },
  });
}

export function unblockSubscriber(userId) {
  return client.post(`/receipta-subscriptions/${userId}/unblock`);
}

export function deleteSubscriber(userId) {
  return client.delete(`/receipta-subscriptions/${userId}`);
}
