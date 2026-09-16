import { Dialog, DialogContent, DialogTitle, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { DialogCloseButton } from './DialogCloseButton';

/**
 * Asks which of several phonebook entries to use. The device picker can hand back more
 * than one (see `useContactPicker`), and guessing would silently fill the wrong client.
 * `candidates` is `[{ name, tel }]`; `onChoose(candidate)` fires with the tapped one.
 */
export function ContactChoiceDialog({ candidates, onChoose, onClose }) {
  const open = Boolean(candidates?.length);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="contact-choice-title">
      <DialogTitle id="contact-choice-title" sx={{ pr: 7, pb: 0.5 }}>Choose one contact</DialogTitle>
      <DialogCloseButton onClose={onClose} />
      <DialogContent sx={{ px: 1, pb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
          More than one number was selected. Tap the one to use for this client.
        </Typography>
        <List disablePadding>
          {(candidates ?? []).map((candidate, index) => (
            <ListItemButton key={`${candidate.name}-${candidate.tel}-${index}`} onClick={() => onChoose(candidate)} sx={{ borderRadius: 1 }}>
              <ListItemText
                primary={candidate.name || 'Unnamed contact'}
                // As saved in the phonebook: reformatting a landline as "+91 …" would pass it off as a mobile.
                secondary={candidate.tel || 'No phone number'}
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
