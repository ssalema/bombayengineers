import { ApiError } from '../utils/ApiError.js';

/** Validates req.body/query/params with Zod schemas and replaces them with the parsed data. */
export const validate = (schemas) => (req, _res, next) => {
  const errors = [];

  for (const source of ['params', 'query', 'body']) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ field: issue.path.join('.') || source, message: issue.message });
      }
      continue;
    }

    if (source === 'query') {
      // req.query is a getter in some setups; store parsed copy separately.
      req.validatedQuery = result.data;
    } else {
      req[source] = result.data;
    }
  }

  if (errors.length) return next(ApiError.badRequest('Validation failed', errors));
  return next();
};
