import { env } from '../config/env.js';

const yymmFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: env.APP_TIMEZONE,
  year: '2-digit',
  month: '2-digit',
});

/** Returns "YYMM" for the given date in the application timezone, e.g. "2609". */
export function toYYMM(date) {
  const parts = Object.fromEntries(yymmFormatter.formatToParts(date).map((p) => [p.type, p.value]));
  return `${parts.year}${parts.month}`;
}

const pad2 = (n) => String(n).padStart(2, '0');

/**
 * Indian financial year (1 Apr – 31 Mar) of a date in the app timezone.
 * e.g. Sep 2026 → { key: "2627", months: ["2604", ..., "2703"] }
 */
export function toFinancialYear(date) {
  const yymm = toYYMM(date);
  const yy = Number(yymm.slice(0, 2));
  const mm = Number(yymm.slice(2));
  const startYY = mm >= 4 ? yy : (yy + 99) % 100;
  const endYY = (startYY + 1) % 100;
  const months = [
    ...[4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => `${pad2(startYY)}${pad2(m)}`),
    ...[1, 2, 3].map((m) => `${pad2(endYY)}${pad2(m)}`),
  ];
  return { key: `${pad2(startYY)}${pad2(endYY)}`, months };
}

const yearFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: env.APP_TIMEZONE, year: 'numeric' });

export const currentYear = () => Number(yearFormatter.format(new Date()));
