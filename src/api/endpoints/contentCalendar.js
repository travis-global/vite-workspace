// src/api/endpoints/contentCalendar.js
// Backend: features/content_calendar_system/routes.py

import client from '../client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export function listCalendarEntries({ startDate, endDate, status, channel } = {}) {
  return client.get('/marketing/calendar', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status: status || undefined,
      channel: channel || undefined,
    },
  });
}

export function createCalendarEntry({
  calendarDate,
  title,
  channel,
  postingTime,
  customFields,
}) {
  return client.post('/marketing/calendar', customFields || null, {
    params: {
      calendar_date: calendarDate,
      title,
      channel,
      posting_time: postingTime || undefined,
    },
  });
}

export function updateCalendarEntry(entryId, { title, postingTime, channel } = {}) {
  return client.patch(`/marketing/calendar/${entryId}`, null, {
    params: {
      title: title || undefined,
      posting_time: postingTime || undefined,
      channel: channel || undefined,
    },
  });
}

export function updateEntryStatus(entryId, { newStatus, reason, madeBy } = {}) {
  return client.post(`/marketing/calendar/${entryId}/status`, null, {
    params: {
      new_status: newStatus,
      reason: reason || undefined,
      made_by: madeBy || undefined,
    },
  });
}

/** Opens CSV download in a new tab (uses token from localStorage).*/
export function exportCsvUrl({ startDate, endDate, status, channel } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  if (status) params.set('status', status);
  if (channel) params.set('channel', channel);
  const q = params.toString();
  return API_BASE + '/marketing/calendar/export/csv' + (q ? '?' + q : '');
}

export function exportPdfUrl({ startDate, endDate, status, channel } = {}) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  if (status) params.set('status', status);
  if (channel) params.set('channel', channel);
  const q = params.toString();
  return API_BASE + '/marketing/calendar/export/pdf' + (q ? '?' + q : '');
}

