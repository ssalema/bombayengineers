import { z } from 'zod';
import { objectId, optionalDate, paginationQuery } from '../../utils/validators.js';

const money = (label) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(100_000_000, `${label} is too large`);

const itemSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(300, 'Description is too long'),
  qty: money('Qty').refine((v) => v > 0, 'Qty must be greater than 0'),
  rate: money('Rate'),
});

export const createChallanSchema = z.object({
  date: z.coerce
    .date({ error: 'Enter a valid date' })
    // One day tolerance covers client/server timezone differences.
    .refine((d) => d.getTime() <= Date.now() + 24 * 60 * 60 * 1000, 'Challan date cannot be in the future'),
  client: objectId,
  items: z.array(itemSchema).min(1, 'Add at least one item').max(100, 'A challan can have at most 100 items'),
});

const filterFields = {
  search: paginationQuery.search,
  from: optionalDate,
  to: optionalDate,
  client: z.preprocess((v) => (v === '' ? undefined : v), objectId.optional()),
};

const validRange = [
  (q) => !q.from || !q.to || q.from <= q.to,
  { path: ['to'], message: '"To" date must be after "From" date' },
];

export const listChallansQuery = z
  .object({
    ...paginationQuery,
    ...filterFields,
    sort: z.enum(['date', 'challanNo', 'totalAmount', 'clientName']).default('date'),
    // summary=false skips totals for cheaper paging (use /challans/summary).
    summary: z.enum(['true', 'false']).default('true').transform((v) => v === 'true'),
  })
  .refine(...validRange);

export const challanSummaryQuery = z.object(filterFields).refine(...validRange);

export const nextNumberQuery = z.object({
  date: optionalDate,
});
