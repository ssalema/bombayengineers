import mongoose from 'mongoose';
import { z } from 'zod';
import { PAGINATION } from '../constants/index.js';

const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v);

export const objectId = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v) && /^[a-f\d]{24}$/i.test(v), 'Invalid id');

export const idParamSchema = z.object({ id: objectId });

export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  order: z.enum(['asc', 'desc']).default('desc'),
};

export const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());

export const optionalString = (max) => z.preprocess((v) => v ?? '', z.string().trim().max(max));

export const phoneNumber = z.preprocess(
  (v) => v ?? '',
  z
    .string()
    .trim()
    .max(20, 'Contact number is too long')
    .refine((v) => v === '' || /^[+]?[\d\s-]{7,20}$/.test(v), 'Enter a valid contact number'),
);
