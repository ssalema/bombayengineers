import { Link as RouterLink } from 'react-router';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { DialogCloseButton } from '../common/DialogCloseButton';
import { useChallanActions } from '../../hooks/useChallanActions';
import { formatCurrency } from '../../utils/format';
import { ROUTES } from '../../config/constants';
import { ChallanLanguageDialog } from './ChallanLanguageDialog';

/** Confirmation shown after a challan is created, with quick print / PDF actions. */
export function ChallanSavedDialog({ challan, onClose }) {
  const actions = useChallanActions();

  return (
    <>
      <Dialog open={Boolean(challan)} onClose={onClose} maxWidth="xs" fullWidth aria-labelledby="saved-title">
        {challan && (
          <>
            <DialogCloseButton onClose={onClose} />
            <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
              <CheckCircleRoundedIcon color="success" sx={{ fontSize: 56 }} />
              <Typography id="saved-title" variant="h6" sx={{ mt: 1 }}>
                Challan saved
              </Typography>
              <Typography sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '0.04em', mt: 0.5 }}>{challan.challanNo}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {challan.clientName} · {formatCurrency(challan.totalAmount)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={actions.isBusy(challan, 'print') ? <CircularProgress size={16} /> : <PrintOutlinedIcon />}
                  onClick={() => actions.print(challan)}
                >
                  Print
                </Button>
                <Button
                  variant="contained"
                  startIcon={actions.isBusy(challan, 'pdf') ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfOutlinedIcon />}
                  onClick={() => actions.downloadPdf(challan)}
                >
                  Download PDF
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button component={RouterLink} to={ROUTES.CHALLAN_CREATE}>
                Create another
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <ChallanLanguageDialog {...actions.languagePrompt} />
    </>
  );
}
