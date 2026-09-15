// src/api/endpoints/chat.js
// Backend: features/general_chat_system/routes.py

import client from '../client';

export function listChannels() {
  return client.get('/chat/channels');
}

export function createChannel({ name, memberIds }) {
  return client.post('/chat/channels', memberIds || [], {
    params: { name: name },
  });
}

export function startDm(otherUserId) {
  return client.post('/chat/dm/' + otherUserId);
}

export function getMessages(channelId, { beforeId, limit } = {}) {
  return client.get('/chat/channels/' + channelId + '/messages', {
    params: {
      before_id: beforeId || undefined,
      limit: limit || undefined,
    },
  });
}

export function sendMessage(channelId, content) {
  return client.post('/chat/channels/' + channelId + '/messages', null, {
    params: { content: content },
  });
}

export function markChannelRead(channelId, upToMessageId) {
  return client.post('/chat/channels/' + channelId + '/read', null, {
    params: { up_to_message_id: upToMessageId },
  });
}
