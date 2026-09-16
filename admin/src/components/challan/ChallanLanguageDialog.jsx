import {
  Box, Dialog, DialogContent, DialogTitle, List, ListItemButton, Stack, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { radius } from '../../theme/theme';
import { languageOptions } from '../../i18n/languages';
import { DialogCloseButton } from '../common/DialogCloseButton';

const KIND = {
  print: {
    title: 'Print challan',
    // Printing yields two copies, so each option names both: client copy first, then office copy.
    helper: 'Choose the languages for the client copy and the office copy.',
    icon: PrintOutlinedIcon,
  },
  pdf: { title: 'Download PDF', helper: 'Choose the language for the downloaded PDF.', icon: PictureAsPdfOutlinedIcon },
};

/**
 * Asks which language(s) a challan should be printed / downloaded in.
 * `kind` is "print" or "pdf"; `onSelect` receives the chosen option's `{ client, office }` codes.
 */
export function ChallanLanguageDialog({ open, kind = 'print', challanNo, onSelect, onClose }) {
  const { title, helper, icon: KindIcon } = KIND[kind] ?? KIND.print;
  const options = languageOptions(kind);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="challan-language-title">
      <DialogTitle id="challan-language-title" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1, pr: 7 }}>
        <Box
          sx={(t) => ({
            width: 40,
            height: 40,
            borderRadius: radius.round,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(t.palette.primary.main, 0.1),
            color: 'primary.main',
            flexShrink: 0,
          })}
        >
          <KindIcon fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          {title}
          {challanNo && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {challanNo}
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogCloseButton onClose={onClose} />
      <DialogContent sx={{ pt: 0 }}>
        <Typography color="text.secondary" variant="body2">
          {helper}
        </Typography>
        <List sx={{ mt: 1.5, p: 0 }}>
          {options.map((option) => (
            <ListItemButton
              key={option.id}
              onClick={() => onSelect({ client: option.client, office: option.office })}
              sx={{
                borderRadius: radius.md,
                border: 1,
                borderColor: 'divider',
                px: 2,
                py: 1.5,
                mb: 1,
                gap: 1.5,
                '&:last-of-type': { mb: 0 },
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
              }}
            >
              <TranslateRoundedIcon fontSize="small" sx={{ color: 'primary.main', flexShrink: 0 }} />
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography lang={option.client} sx={{ fontWeight: 600, lineHeight: 1.5 }} noWrap>
                  {option.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {option.caption}
                </Typography>
              </Stack>
              <ChevronRightRoundedIcon fontSize="small" sx={{ color: 'text.disabled', flexShrink: 0 }} />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
