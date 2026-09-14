import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import { PERIODS, ROWS_PER_PAGE_OPTIONS } from '../config/constants';

const positiveInt = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/** List state (search, pagination, period) kept in the URL so it survives refresh and can be shared. */
export function useListParams({ withPeriod = false, defaultPeriod = PERIODS.MONTHLY } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(() => {
    const limit = positiveInt(searchParams.get('limit'), ROWS_PER_PAGE_OPTIONS[0]);
    const base = {
      search: searchParams.get('q') ?? '',
      page: positiveInt(searchParams.get('page'), 1),
      limit: ROWS_PER_PAGE_OPTIONS.includes(limit) ? limit : ROWS_PER_PAGE_OPTIONS[0],
    };
    if (!withPeriod) return base;

    const period = Object.values(PERIODS).includes(searchParams.get('period')) ? searchParams.get('period') : defaultPeriod;
    const month = /^\d{4}-\d{2}$/.test(searchParams.get('month') ?? '') ? searchParams.get('month') : dayjs().format('YYYY-MM');
    const year = /^\d{4}$/.test(searchParams.get('year') ?? '') ? searchParams.get('year') : String(dayjs().year());
    return { ...base, period, month, year, from: searchParams.get('from') ?? '', to: searchParams.get('to') ?? '' };
  }, [searchParams, withPeriod, defaultPeriod]);

  const update = useCallback(
    (changes, { resetPage = true } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const keyMap = { search: 'q' };
          for (const [key, value] of Object.entries(changes)) {
            const param = keyMap[key] ?? key;
            if (value === '' || value === undefined || value === null) next.delete(param);
            else next.set(param, String(value));
          }
          if (resetPage && !('page' in changes)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setters = useMemo(
    () => ({
      setSearch: (search) => update({ search }),
      setPage: (page) => update({ page }, { resetPage: false }),
      setLimit: (limit) => update({ limit }),
      setFilter: (changes) => update(changes),
    }),
    [update],
  );

  return { ...state, ...setters };
}
