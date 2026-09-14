/** Extracts a user-friendly message from an Axios/API error. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (error.message === 'Network Error') return 'Unable to reach the server. Check your connection.';
  return error.response?.data?.message || error.message || fallback;
}

/** Pushes field-level API validation errors into react-hook-form. */
export function applyServerErrors(error, setError) {
  const errors = error?.response?.data?.errors;
  if (!Array.isArray(errors)) return false;
  let applied = false;
  for (const { field, message } of errors) {
    if (field) {
      setError(field, { type: 'server', message });
      applied = true;
    }
  }
  return applied;
}
