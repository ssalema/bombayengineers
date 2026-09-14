export const API_PREFIX = '/api/v1';

export const REFRESH_COOKIE_NAME = 'cc_refresh';
export const REFRESH_COOKIE_PATH = `${API_PREFIX}/auth`;

export const CHALLAN_PREFIX = 'BE';
export const CHALLAN_SEQUENCE_LENGTH = 5;

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
});

export const UPLOAD = Object.freeze({
  MAX_FILE_SIZE: 2 * 1024 * 1024,
  // SVG is intentionally excluded: it can carry executable script.
  IMAGE_MIME_TYPES: ['image/png', 'image/jpeg', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'],
});

export const SETTINGS_KEY = 'site';
