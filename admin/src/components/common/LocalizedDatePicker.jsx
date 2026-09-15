import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { usePickerContext, useSplitFieldProps } from '@mui/x-date-pickers/hooks';
import { CalendarIcon, ClearIcon } from '@mui/x-date-pickers/icons';
import 'dayjs/locale/en-gb';

const DISPLAY_FORMAT = 'DD/MM/YYYY';

/** Formats raw keystrokes as DD/MM/YYYY, inserting slashes only once the next part has started. */
function maskDate(input) {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += `/${digits.slice(2, 4)}`;
  if (digits.length > 4) out += `/${digits.slice(4)}`;
  return out;
}

/** Strictly parses a complete DD/MM/YYYY string; returns null for incomplete or impossible dates (e.g. 31/02). */
function parseDate(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [, dd, mm, yyyy] = match.map(Number);
  const date = dayjs(new Date(yyyy, mm - 1, dd));
  return date.date() === dd && date.month() === mm - 1 && date.year() === yyyy ? date : null;
}

function rangeError(date, minDate, maxDate) {
  if (minDate && date.isBefore(minDate, 'day')) return `Date can't be before ${minDate.format(DISPLAY_FORMAT)}`;
  if (maxDate && date.isAfter(maxDate, 'day')) return `Date can't be after ${maxDate.format(DISPLAY_FORMAT)}`;
  return '';
}

/**
 * Plain typed field for the picker. Replaces MUI's section-based field, which shows
 * placeholders like "YYYY" / "Y202" while a year is only partially typed.
 */
function TypedDateField(props) {
  const { internalProps, forwardedProps } = useSplitFieldProps(props, 'date');
  const { minDate, maxDate, disabled, readOnly } = internalProps;
  const { slotProps, clearable } = forwardedProps;
  const picker = usePickerContext();
  const { sx, error, helperText, onBlur, ...textFieldProps } = slotProps?.textField ?? {};

  const value = picker.value?.isValid() ? picker.value : null;
  const [text, setText] = useState(value ? value.format(DISPLAY_FORMAT) : '');
  const [localError, setLocalError] = useState('');

  // Sync when the value changes from outside (calendar pick, clear, parent reset),
  // without clobbering text the user is still typing.
  useEffect(() => {
    setText((current) => {
      const typed = parseDate(current);
      if (value ? typed?.isSame(value, 'day') : current === '' || !typed) return current;
      return value ? value.format(DISPLAY_FORMAT) : '';
    });
    if (value) setLocalError('');
  }, [value?.valueOf()]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (event) => {
    const next = maskDate(event.target.value);
    setText(next);

    if (next === '') {
      setLocalError('');
      if (value) picker.setValue(null);
      return;
    }
    const date = parseDate(next);
    if (!date) {
      setLocalError(next.length === 10 ? 'Invalid date' : '');
      return;
    }
    const outOfRange = rangeError(date, minDate, maxDate);
    setLocalError(outOfRange);
    if (!outOfRange && !date.isSame(value, 'day')) picker.setValue(date);
  };

  const handleBlur = (event) => {
    // Drop incomplete or invalid input and fall back to the last valid value.
    if (text !== '' && (!parseDate(text) || localError)) {
      setText(value ? value.format(DISPLAY_FORMAT) : '');
      setLocalError('');
    }
    onBlur?.(event);
  };

  const handleClear = () => {
    setText('');
    setLocalError('');
    picker.setValue(null);
  };

  const inactive = disabled || readOnly;

  return (
    <TextField
      {...textFieldProps}
      ref={picker.rootRef}
      className={picker.rootClassName}
      sx={[...(Array.isArray(picker.rootSx) ? picker.rootSx : [picker.rootSx]), ...(Array.isArray(sx) ? sx : [sx])]}
      label={picker.label}
      name={picker.name}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      error={Boolean(localError) || Boolean(error)}
      helperText={localError || helperText}
      placeholder={DISPLAY_FORMAT.toLowerCase()}
      slotProps={{
        ...textFieldProps.slotProps,
        htmlInput: { inputMode: 'numeric', autoComplete: 'off', maxLength: 10, readOnly, ...textFieldProps.slotProps?.htmlInput },
        input: {
          endAdornment: (
            <InputAdornment position="end" sx={{ ml: 0 }}>
              {clearable && text && !inactive && (
                <IconButton size="small" aria-label="Clear date" onClick={handleClear} edge="end" sx={{ mr: 0.25 }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                ref={picker.triggerRef}
                size="small"
                edge="end"
                aria-label="Choose date"
                disabled={inactive}
                onClick={() => picker.setOpen((open) => !open)}
              >
                <CalendarIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

/** DatePicker with en-GB locale and a plain DD/MM/YYYY typed field. The provider lives here so the picker library loads only when used. */
export function LocalizedDatePicker({ slots, ...props }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
      <DatePicker format={DISPLAY_FORMAT} {...props} slots={{ field: TypedDateField, ...slots }} />
    </LocalizationProvider>
  );
}
