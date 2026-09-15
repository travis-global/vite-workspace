// src/api/endpoints/workerQueries.js
// Backend: features/worker_query_system/routes.py

import client from '../client';

export function listMyQueries() {
  return client.get('/worker-queries/mine');
}

export function listIssuedQueries() {
  return client.get('/worker-queries/issued');
}

export function getQuery(queryId) {
  return client.get('/worker-queries/' + queryId);
}

export function issueQuery({ issuedTo, subject, body, responseDeadline }) {
  return client.post('/worker-queries', null, {
    params: {
      issued_to: issuedTo,
      subject: subject,
      body: body,
      response_deadline: responseDeadline || undefined,
    },
  });
}

export function respondToQuery(queryId, responseText) {
  return client.post('/worker-queries/' + queryId + '/respond', null, {
    params: { response_text: responseText },
  });
}

export function closeQuery(queryId, { outcome, outcomeNote } = {}) {
  return client.post('/worker-queries/' + queryId + '/close', null, {
    params: {
      outcome: outcome,
      outcome_note: outcomeNote || undefined,
    },
  });
}
