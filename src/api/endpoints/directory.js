// src/api/endpoints/directory.js

import client from '../client';

export function listStaffDirectory() {
  return client.get('/directory/staff');
}
