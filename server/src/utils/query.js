/** Escapes user input so it can be safely embedded in a RegExp. */
export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildPaginationMeta({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Sorts to match the indexes: `name` uses case-insensitive collation,
 * other fields add an `_id` tie-breaker.
 */
export function indexedSort(query, { sort, order }) {
  const direction = order === 'asc' ? 1 : -1;
  if (sort === 'name') return query.collation({ locale: 'en', strength: 2 }).sort({ name: direction });
  return query.sort({ [sort]: direction, _id: direction });
}

/** Rounds a monetary value to 2 decimals avoiding floating point drift. */
export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
