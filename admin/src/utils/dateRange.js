import dayjs from 'dayjs';
import { PERIODS } from '../config/constants';

/**
 * Converts a period filter into an ISO date range in the browser's local time.
 * Month is "YYYY-MM", year is "YYYY", custom dates are "YYYY-MM-DD".
 */
export function resolveDateRange({ period, month, year, from, to }) {
  switch (period) {
    case PERIODS.MONTHLY: {
      const m = dayjs(`${month}-01`);
      const base = m.isValid() ? m : dayjs();
      return { from: base.startOf('month').toISOString(), to: base.endOf('month').toISOString() };
    }
    case PERIODS.YEARLY: {
      const y = Number(year) || dayjs().year();
      const base = dayjs().year(y);
      return { from: base.startOf('year').toISOString(), to: base.endOf('year').toISOString() };
    }
    case PERIODS.CUSTOM: {
      const f = from ? dayjs(from) : null;
      const t = to ? dayjs(to) : null;
      return {
        from: f?.isValid() ? f.startOf('day').toISOString() : undefined,
        to: t?.isValid() ? t.endOf('day').toISOString() : undefined,
      };
    }
    default:
      return { from: undefined, to: undefined };
  }
}

export function describePeriod({ period, month, year, from, to }) {
  switch (period) {
    case PERIODS.MONTHLY:
      return dayjs(`${month}-01`).format('MMMM YYYY');
    case PERIODS.YEARLY:
      return `Year ${year}`;
    case PERIODS.CUSTOM:
      if (from && to) return `${dayjs(from).format('DD MMM YYYY')} – ${dayjs(to).format('DD MMM YYYY')}`;
      if (from) return `From ${dayjs(from).format('DD MMM YYYY')}`;
      if (to) return `Until ${dayjs(to).format('DD MMM YYYY')}`;
      return 'Custom range';
    default:
      return 'All time';
  }
}
