import { Box, IconButton, Typography } from '@mui/material';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { radius } from '../../theme/theme';

/** Rounded "‹ Sep 2026 ›" stepper used by the period filter and the dashboard chart. */
export function PeriodStepper({ label, onPrev, onNext, prevDisabled = false, nextDisabled = false, prevLabel, nextLabel }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        border: 1,
        borderColor: 'divider',
        borderRadius: radius.pill,
        bgcolor: 'background.paper',
        height: 38,
        px: 0.5,
        flexShrink: 0,
      }}
    >
      <IconButton size="small" onClick={onPrev} disabled={prevDisabled} aria-label={prevLabel} sx={{ borderRadius: radius.round }}>
        <ChevronLeftRoundedIcon fontSize="small" />
      </IconButton>
      <Typography
        component="span"
        variant="body2"
        aria-live="polite"
        sx={{ minWidth: 72, textAlign: 'center', fontWeight: 700, px: 1, fontVariantNumeric: 'tabular-nums' }}
      >
        {label}
      </Typography>
      <IconButton size="small" onClick={onNext} disabled={nextDisabled} aria-label={nextLabel} sx={{ borderRadius: radius.round }}>
        <ChevronRightRoundedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
