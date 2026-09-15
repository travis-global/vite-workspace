// src/api/endpoints/vendorSubscriptions.js
// Backend: features/vendor_subscriptions/routes.py
// POST uses query params (same pattern as revenue).

import client from '../client';

export function listVendorSubscriptions({ status } = {}) {
  return client.get('/accounting/vendor-subscriptions', {
    params: { status: status || undefined },
  });
}

export function getUpcomingRenewals({ withinDays = 14 } = {}) {
  return client.get('/accounting/vendor-subscriptions/upcoming-renewals', {
    params: { within_days: withinDays },
  });
}

export function addVendorSubscription({
  vendorName,
  amount,
  billingCycle,
  serviceDescription,
  renewalDate,
}) {
  return client.post('/accounting/vendor-subscriptions', null, {
    params: {
      vendor_name: vendorName,
      amount,
      billing_cycle: billingCycle,
      service_description: serviceDescription || undefined,
      renewal_date: renewalDate || undefined,
    },
  });
}

export function cancelVendorSubscription(subscriptionId) {
  return client.post(`/accounting/vendor-subscriptions/${subscriptionId}/cancel`);
}
