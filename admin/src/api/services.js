import { http, unwrap } from './http';

/** Drops empty values so URLs stay clean and the API receives only real filters. */
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const authApi = {
  login: (body) => unwrap(http.post('/auth/login', body)),
  logout: () => unwrap(http.post('/auth/logout')),
  updateProfile: (body) => unwrap(http.patch('/auth/profile', body)),
  changePassword: (body) => unwrap(http.patch('/auth/change-password', body)),
  uploadAvatar: (file, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap(
      http.post('/auth/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      }),
    );
  },
  removeAvatar: () => unwrap(http.delete('/auth/avatar')),
};

export const dashboardApi = {
  overview: () => unwrap(http.get('/dashboard/overview')),
  monthly: (year) => unwrap(http.get('/dashboard/monthly', { params: { year } })),
};

export const challanApi = {
  list: (params) => unwrap(http.get('/challans', { params: clean(params) })),
  summary: (params) => unwrap(http.get('/challans/summary', { params: clean(params) })),
  get: (id) => unwrap(http.get(`/challans/${id}`)),
  nextNumber: (date) => unwrap(http.get('/challans/next-number', { params: clean({ date }) })),
  create: (body) => unwrap(http.post('/challans', body)),
  remove: (id) => unwrap(http.delete(`/challans/${id}`)),
};

export const clientApi = {
  list: (params) => unwrap(http.get('/clients', { params: clean(params) })),
  options: (search) => unwrap(http.get('/clients/options', { params: clean({ search }) })),
  get: (id) => unwrap(http.get(`/clients/${id}`)),
  create: (body) => unwrap(http.post('/clients', body)),
  update: (id, body) => unwrap(http.put(`/clients/${id}`, body)),
  remove: (id) => unwrap(http.delete(`/clients/${id}`)),
};

export const descriptionApi = {
  list: (params) => unwrap(http.get('/descriptions', { params: clean(params) })),
  options: () => unwrap(http.get('/descriptions/options')),
  create: (body) => unwrap(http.post('/descriptions', body)),
  update: (id, body) => unwrap(http.put(`/descriptions/${id}`, body)),
  remove: (id) => unwrap(http.delete(`/descriptions/${id}`)),
};

export const settingsApi = {
  public: () => unwrap(http.get('/settings/public')),
  update: (body) => unwrap(http.put('/settings', body)),
  uploadAsset: (asset, file) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap(http.post(`/settings/${asset}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
  removeAsset: (asset) => unwrap(http.delete(`/settings/${asset}`)),
};
