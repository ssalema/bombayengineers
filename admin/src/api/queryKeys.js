/** Centralised React Query keys so invalidation stays consistent across features. */
export const queryKeys = {
  settings: ['settings'],
  dashboard: {
    all: ['dashboard'],
    overview: ['dashboard', 'overview'],
    monthly: (year) => ['dashboard', 'monthly', year],
  },
  challans: {
    all: ['challans'],
    list: (params) => ['challans', 'list', params],
    summary: (filters) => ['challans', 'summary', filters],
    detail: (id) => ['challans', 'detail', id],
    nextNumber: (month) => ['challans', 'next-number', month],
  },
  clients: {
    all: ['clients'],
    list: (params) => ['clients', 'list', params],
    detail: (id) => ['clients', 'detail', id],
    options: (search) => ['clients', 'options', search],
  },
  descriptions: {
    all: ['descriptions'],
    list: (params) => ['descriptions', 'list', params],
    options: ['descriptions', 'options'],
  },
};
