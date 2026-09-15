// src/api/endpoints/salary.js
// Backend: features/salary_payment_system/routes.py

import client from '../client';

export function listStaffSalaries() {
  return client.get('/salary/staff-details');
}

export function setStaffSalary({
  userId,
  monthlyAmount,
  bankAccountName,
  bankAccountNumber,
  bankCode,
}) {
  return client.post('/salary/staff-details', {
    user_id: userId,
    monthly_amount: monthlyAmount,
    bank_account_name: bankAccountName,
    bank_account_number: bankAccountNumber,
    bank_code: bankCode,
  });
}

export function listPayrollRuns() {
  return client.get('/salary/payroll-runs');
}

export function getPayrollRun(runId) {
  return client.get('/salary/payroll-runs/' + runId);
}

export function createPayrollRun({ period, userIds }) {
  return client.post('/salary/payroll-runs', {
    period: period,
    user_ids: userIds && userIds.length ? userIds : null,
  });
}

export function verifyPayrollRun(runId, code) {
  return client.post('/salary/payroll-runs/' + runId + '/verify', {
    code: code,
  });
}
