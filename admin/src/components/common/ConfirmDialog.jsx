import { Box, Dialog, DialogContent, DialogTitle, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { radius } from '../../theme/theme';
import { DialogCloseButton } from './DialogCloseButton';
import { DialogFooter } from './DialogFooter';

export function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  tone = 'error',
  loading = false,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth aria-labelledby="confirm-title">
      <DialogTitle id="confirm-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, pr: 7 }}>
        <Box
          sx={(t) => ({
            width: 40,
            height: 40,
            borderRadius: radius.round,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(t.palette[tone].main, 0.1),
            color: `${tone}.main`,
            flexShrink: 0,
          })}
        >
          <WarningAmberRoundedIcon fontSize="small" />
        </Box>
        {title}
      </DialogTitle>
      <DialogCloseButton onClose={onClose} disabled={loading} />
      <DialogContent>
        <Typography color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogFooter
        confirmLabel={confirmLabel}
        onConfirm={onConfirm}
        color={tone}
        loading={loading}
      />
    </Dialog>
  );
}
