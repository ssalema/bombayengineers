import mongoose from 'mongoose';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/** Maps known library errors onto ApiError instances. */
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed', errors);
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${err.path}`);
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? err.keyPattern ?? {})[0] ?? 'field';
    return ApiError.conflict(`A record with this ${field} already exists`, [
      { field, message: `This ${field} is already in use` },
    ]);
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    return ApiError.badRequest(message, [{ field: err.field ?? 'file', message }]);
  }

  if (err instanceof jwt.TokenExpiredError) return ApiError.unauthorized('Session expired');
  if (err instanceof jwt.JsonWebTokenError) return ApiError.unauthorized('Invalid token');

  if (err?.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON body');
  if (err?.type === 'entity.too.large') return new ApiError(413, 'Request body too large');

  const wrapped = new ApiError(err?.statusCode || 500, 'Something went wrong. Please try again later.');
  wrapped.isOperational = false;
  wrapped.original = err;
  return wrapped;
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const apiError = normalizeError(err);

  if (!apiError.isOperational || apiError.statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} failed`, {
      error: apiError.original?.message ?? apiError.message,
      stack: apiError.original?.stack ?? apiError.stack,
    });
  }

  const body = {
    success: false,
    message: apiError.message,
    errors: apiError.errors ?? [],
  };

  if (env.isDevelopment && apiError.original) body.debug = apiError.original.message;

  res.status(apiError.statusCode).json(body);
}
