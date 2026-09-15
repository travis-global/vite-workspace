// src/api/endpoints/theme.js
// Backend: features/theme_preference/routes.py

import client from '../client';

export function getMyTheme() {
  return client.get('/me/theme');
}

export function setMyTheme(themePreference) {
  return client.patch('/me/theme', null, {
    params: { theme_preference: themePreference },
  });
}
