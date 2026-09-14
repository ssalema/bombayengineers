/**
 * In-process cache for dashboard data, cleared when challans or clients change.
 * The TTL covers writes made outside this process.
 */
const TTL_MS = 5 * 60 * 1000;
const entries = new Map();

export async function cached(key, compute) {
  const hit = entries.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.promise;

  const promise = compute();
  entries.set(key, { promise, expiresAt: Date.now() + TTL_MS });
  // Never cache a failure.
  promise.catch(() => entries.get(key)?.promise === promise && entries.delete(key));
  return promise;
}

export function invalidateDashboard() {
  entries.clear();
}
