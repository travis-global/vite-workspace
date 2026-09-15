// src/api/endpoints/meetings.js
// Backend: features/meeting_scheduling_system/routes.py

import client from '../client';

export function listMyMeetings() {
  return client.get('/meetings');
}

export function getMeeting(meetingId) {
  return client.get('/meetings/' + meetingId);
}

export function createMeeting({
  title,
  startTime,
  endTime,
  description,
  isGeneral,
  attendeeIds,
}) {
  return client.post(
    '/meetings',
    isGeneral ? null : attendeeIds || [],
    {
      params: {
        title: title,
        start_time: startTime,
        end_time: endTime,
        description: description || undefined,
        is_general: isGeneral ? true : false,
      },
    }
  );
}

export function rescheduleMeeting(meetingId, { startTime, endTime }) {
  return client.patch('/meetings/' + meetingId + '/reschedule', null, {
    params: {
      start_time: startTime,
      end_time: endTime,
    },
  });
}

export function cancelMeeting(meetingId) {
  return client.post('/meetings/' + meetingId + '/cancel');
}
