import dayjs from 'dayjs';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

const compactFormatter = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

/** Amount without currency symbol, e.g. 12,500.00 (printed challan). */
export const formatAmount = (value) =>
  (Number(value) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

export const formatCompactCurrency = (value) => `₹${compactFormatter.format(Number(value) || 0)}`;

/** Placeholder for missing values. */
export const EMPTY_VALUE = '—';

export const formatDate = (value) => (value ? dayjs(value).format('DD MMM YYYY') : EMPTY_VALUE);

export const formatDateTime = (value) => (value ? dayjs(value).format('DD MMM YYYY, hh:mm A') : EMPTY_VALUE);

export const formatChallanDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '');

export const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

/** 10-digit mobile number without +91 / 0 prefix, e.g. "9820011223". */
export const toLocalMobile = (value = '') => {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length > 10 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

/** Display form of a contact number, e.g. "+91 98200 11223". */
export const formatPhone = (value) => {
  const local = toLocalMobile(value);
  if (!local) return '';
  return local.length === 10 ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : `+91 ${local}`;
};

/** Removes characters that are invalid in file names on Windows/macOS/Linux. */
export const safeFileName = (name) => name.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim();
