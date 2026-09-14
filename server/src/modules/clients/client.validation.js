import { z } from 'zod';
import { paginationQuery, phoneNumber } from '../../utils/validators.js';

export const clientBodySchema = z.object({
  name: z.string().trim().min(2, 'Client name must be at least 2 characters').max(120, 'Client name is too long'),
  contactNumber: phoneNumber,
});

export const listClientsQuery = z.object({
  ...paginationQuery,
  sort: z.enum(['name', 'createdAt']).default('createdAt'),
});

export const clientOptionsQuery = z.object({
  search: paginationQuery.search,
});
