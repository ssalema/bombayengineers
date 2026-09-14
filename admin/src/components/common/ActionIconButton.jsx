import { CircularProgress, IconButton, Stack, Tooltip } from '@mui/material';

/** 34×34 icon button with tooltip (`disabledReason` when disabled). Clicks don't bubble to the row. */
export function ActionIconButton({ title, ariaLabel, onClick, color = 'default', loading = false, disabled = false, disabledReason, children }) {
  const isDisabled = disabled || loading;
  return (
    <Tooltip title={disabled && disabledReason ? disabledReason : title}>
      <span>
        <IconButton
          size="small"
          color={color}
          aria-label={ariaLabel ?? title}
          disabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(e);
          }}
          onKeyDown={(e) => e.stopPropagation()}
          sx={{ width: 34, height: 34, border: 1, borderColor: 'divider' }}
        >
          {loading ? <CircularProgress size={16} color="inherit" /> : children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/** Right-aligned group of ActionIconButtons for a table's Actions column. */
export function RowActions({ children }) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
      {children}
    </Stack>
  );
}
