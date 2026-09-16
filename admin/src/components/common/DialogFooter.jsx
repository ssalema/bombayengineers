import { Button, CircularProgress, DialogActions } from '@mui/material';

/**
 * Dialog footer with the primary action only — dialogs are dismissed via the title-bar close
 * button, so no Cancel is repeated here. Pass `submit` for forms or `onConfirm` for actions.
 */
export function DialogFooter({
  confirmLabel,
  onConfirm,
  submit = false,
  color = 'primary',
  loading = false,
  disabled = false,
}) {
  return (
    <DialogActions>
      <Button
        type={submit ? 'submit' : 'button'}
        onClick={submit ? undefined : onConfirm}
        variant="contained"
        color={color}
        disabled={loading || disabled}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {confirmLabel}
      </Button>
    </DialogActions>
  );
}
