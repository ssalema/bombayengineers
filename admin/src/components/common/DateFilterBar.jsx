import dayjs from 'dayjs';
import { Box, ButtonBase } from '@mui/material';
import { PERIODS } from '../../config/constants';
import { radius } from '../../theme/theme';
import { PeriodStepper } from './PeriodStepper';
import { LocalizedDatePicker } from './LocalizedDatePicker';

const OPTIONS = [
  { value: PERIODS.MONTHLY, label: 'Monthly' },
  { value: PERIODS.YEARLY, label: 'Yearly' },
  { value: PERIODS.ALL, label: 'All time' },
  { value: PERIODS.CUSTOM, label: 'Custom' },
];

/** Segmented toggle button group. */
function PeriodToggle({ value, onChange }) {
  return (
    <Box
      role="group"
      aria-label="Date filter"
      sx={{
        display: 'inline-flex',
        border: 1,
        borderColor: 'divider',
        borderRadius: radius.lg,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        maxWidth: '100%',
      }}
    >
      {OPTIONS.map((opt, idx) => {
        const selected = opt.value === value;
        return (
          <ButtonBase
            key={opt.value}
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            sx={{
              px: { xs: 1.5, sm: 2 },
              height: 38,
              typography: 'body2',
              whiteSpace: 'nowrap',
              fontWeight: selected ? 700 : 500,
              color: selected ? 'text.primary' : 'text.secondary',
              bgcolor: selected ? 'surface.muted' : 'transparent',
              borderLeft: idx === 0 ? 0 : 1,
              borderColor: 'divider',
              transition: 'background-color .15s',
              '&:hover': { bgcolor: selected ? 'surface.strong' : 'action.hover' },
              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
            }}
          >
            {opt.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}

/**
 * Period filter: Monthly | Yearly | All time | Custom.
 * value = { period, month: 'YYYY-MM', year: 'YYYY', from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
 */
export function DateFilterBar({ value, onChange }) {
  const { period, month, year, from, to } = value;
  const monthDate = dayjs(`${month}-01`);
  const now = dayjs();

  const pickerField = { size: 'small', sx: { width: { xs: '100%', sm: 170 } } };

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
      }}
    >
      <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
        <PeriodToggle value={period} onChange={(p) => onChange({ period: p })} />
      </Box>

      {period === PERIODS.MONTHLY && (
        <PeriodStepper
          label={monthDate.format('MMM YYYY')}
          prevLabel="Previous month"
          nextLabel="Next month"
          onPrev={() => onChange({ month: monthDate.subtract(1, 'month').format('YYYY-MM') })}
          onNext={() => onChange({ month: monthDate.add(1, 'month').format('YYYY-MM') })}
          nextDisabled={!monthDate.isBefore(now, 'month')}
        />
      )}

      {period === PERIODS.YEARLY && (
        <PeriodStepper
          label={year}
          prevLabel="Previous year"
          nextLabel="Next year"
          onPrev={() => onChange({ year: String(Number(year) - 1) })}
          onNext={() => onChange({ year: String(Number(year) + 1) })}
          nextDisabled={Number(year) >= now.year()}
        />
      )}

      {period === PERIODS.CUSTOM && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, width: { xs: '100%', sm: 'auto' } }}>
          <LocalizedDatePicker
            label="From"
            value={from ? dayjs(from) : null}
            maxDate={to ? dayjs(to) : now}
            onChange={(d) => onChange({ from: d?.isValid() ? d.format('YYYY-MM-DD') : '' })}
            slotProps={{ textField: pickerField, field: { clearable: true } }}
          />
          <LocalizedDatePicker
            label="To"
            value={to ? dayjs(to) : null}
            minDate={from ? dayjs(from) : undefined}
            maxDate={now}
            onChange={(d) => onChange({ to: d?.isValid() ? d.format('YYYY-MM-DD') : '' })}
            slotProps={{ textField: pickerField, field: { clearable: true } }}
          />
        </Box>
      )}
    </Box>
  );
}
