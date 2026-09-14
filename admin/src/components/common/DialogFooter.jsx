import { Button, CircularProgress, DialogActions } from '@mui/material';

/** Dialog footer with Cancel + primary action. Pass `submit` for forms or `onConfirm` for actions. */
export function DialogFooter({
  onCancel,
  cancelLabel = 'Cancel',
  confirmLabel,
  onConfirm,
  submit = false,
  color = 'primary',
  loading = false,
  disabled = false,
}) {
  return (
    <DialogActions>
      <Button color="inherit" onClick={onCancel} disabled={loading}>
        {cancelLabel}
      </Button>
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
