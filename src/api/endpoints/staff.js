// src/api/endpoints/staff.js
// Backend: features/staff_management/routes.py

import client from '../client';

export function listStaff() {
  return client.get('/staff');
}

export function getStaff(userId) {
  return client.get('/staff/' + userId);
}

export function updateStaff(userId, { fullName, email, phone } = {}) {
  return client.patch('/staff/' + userId, null, {
    params: {
      full_name: fullName || undefined,
      email: email || undefined,
      phone: phone || undefined,
    },
  });
}

export function deactivateStaff(userId) {
  return client.delete('/staff/' + userId);
}

export function getAttendanceSheet({ userId, startDate, endDate } = {}) {
  return client.get('/staff/attendance/sheet', {
    params: {
      user_id: userId || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}

export function clockIn() {
  return client.post('/staff/attendance/clock-in');
}

export function clockOut() {
  return client.post('/staff/attendance/clock-out');
}

export function getMyAttendance({ startDate, endDate } = {}) {
  return client.get('/staff/attendance/mine', {
    params: {
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    },
  });
}
