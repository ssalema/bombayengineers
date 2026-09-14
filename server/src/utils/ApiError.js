export class ApiError extends Error {
  /** `errors`: optional field-level errors, e.g. [{ field, message }]. */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }

  static badRequest(message = 'Bad request', errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists', errors) {
    return new ApiError(409, message, errors);
  }

  static unavailable(message = 'Service unavailable') {
    return new ApiError(503, message);
  }
}
