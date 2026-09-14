import { z } from 'zod';
import { paginationQuery } from '../../utils/validators.js';

export const descriptionBodySchema = z.object({
  name: z.string().trim().min(1, 'Description is required').max(200, 'Description is too long'),});

export const listDescriptionsQuery = z.object({
  ...paginationQuery,
  sort: z.enum(['name', 'createdAt']).default('createdAt'),
});
