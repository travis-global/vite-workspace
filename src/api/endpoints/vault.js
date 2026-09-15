// src/api/endpoints/vault.js
// Backend: features/password_account_management/routes.py

import client from '../client';

export function listVaultAccounts({ project } = {}) {
  return client.get('/vault/accounts', {
    params: {
      project: project || undefined,
    },
  });
}

export function addVaultAccount({
  accountName,
  email,
  password,
  service,
  project,
}) {
  return client.post('/vault/accounts', null, {
    params: {
      account_name: accountName,
      email: email,
      password: password,
      service: service || undefined,
      project: project || undefined,
    },
  });
}

export function deleteVaultAccount(accountId) {
  return client.delete('/vault/accounts/' + accountId);
}

export function requestVaultAccess(accountId) {
  return client.post('/vault/accounts/' + accountId + '/request-access');
}

export function verifyVaultAccess(requestId, code) {
  return client.post('/vault/access-requests/' + requestId + '/verify', null, {
    params: { code: code },
  });
}
