// src/api/endpoints/correspondence.js
// Backend: features/email_letter_system/routes.py

import client from '../client';

export function listEmailTemplates() {
  return client.get('/correspondence/templates/email');
}

export function listLetterTemplates() {
  return client.get('/correspondence/templates/letter');
}

export function reloadTemplates() {
  return client.post('/correspondence/templates/reload');
}

export function sendEmail({ recipientEmail, templateKey, fields }) {
  return client.post('/correspondence/send', fields || {}, {
    params: {
      recipient_email: recipientEmail,
      template_key: templateKey,
    },
  });
}

export function getEmailLog({ recipientEmail } = {}) {
  return client.get('/correspondence/log', {
    params: {
      recipient_email: recipientEmail || undefined,
    },
  });
}

export function generateLetter({
  templateKey,
  recipientName,
  recipientAddress,
  fields,
}) {
  return client.post('/correspondence/generate-letter', fields || {}, {
    params: {
      template_key: templateKey,
      recipient_name: recipientName,
      recipient_address: recipientAddress || undefined,
    },
  });
}
