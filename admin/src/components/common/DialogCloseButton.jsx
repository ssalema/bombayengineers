import { IconButton } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

/** Top-right close button. Give the DialogTitle `pr: 7` so titles don't overlap it. */
export function DialogCloseButton({ onClose, disabled = false, label = 'Close' }) {
  return (
    <IconButton onClick={onClose} disabled={disabled} aria-label={label} sx={{ position: 'absolute', right: 12, top: 12, color: 'text.secondary' }}>
      <CloseRoundedIcon />
    </IconButton>
  );
}
