// Runtime config (public/config.js) overrides the build-time API URL.
export const API_BASE_URL = (window.__APP_CONFIG__?.API_URL || import.meta.env.VITE_API_URL || '/api/v1').replace(/\/+$/, '');

export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const PERIODS = Object.freeze({
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  ALL: 'all',
  CUSTOM: 'custom',
});

/** Max item rows per half-A4 copy; more rows print each copy on its own page. */
export const HALF_PAGE_ITEM_LIMIT = 7;

export const ROUTES = Object.freeze({
  LOGIN: '/login',
  DASHBOARD: '/',
  CHALLANS: '/challans',
  CHALLAN_CREATE: '/challans/new',
  CLIENTS: '/clients',
  clientDetail: (id) => `/clients/${id}`,
  DESCRIPTIONS: '/descriptions',
  SETTINGS: '/settings',
});
