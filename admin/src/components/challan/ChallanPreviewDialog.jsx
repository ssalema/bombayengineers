import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Skeleton, Typography, useMediaQuery, useTheme,
} from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import { challanApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { DialogCloseButton } from '../common/DialogCloseButton';
import { ErrorState } from '../common/TableStates';
import { ScaledChallanPreview } from './ScaledChallanPreview';
import { formatCurrency } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';

export function ChallanPreviewDialog({ challanId, onClose, actions }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: challan, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.challans.detail(challanId),
    queryFn: () => challanApi.get(challanId).then((r) => r.data),
    enabled: Boolean(challanId),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <Dialog open={Boolean(challanId)} onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen} aria-labelledby="challan-preview-title">
      <DialogTitle id="challan-preview-title" sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 7 }}>
        <Box sx={{ minWidth: 0 }}>
          {challan ? challan.challanNo : isLoading ? <Skeleton width={140} /> : 'Challan'}
          {isLoading && <Skeleton width={220} height={20} />}
          {challan && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {challan.clientName} · {formatCurrency(challan.totalAmount)}
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogCloseButton onClose={onClose} label="Close preview" />
      <DialogContent dividers sx={{ bgcolor: 'surface.muted', p: { xs: 1.5, sm: 3 } }}>
        {isLoading && <Skeleton variant="rectangular" height={520} />}
        {error && <ErrorState title="Could not load challan" message={getErrorMessage(error)} onRetry={refetch} />}
        {challan && <ScaledChallanPreview challan={challan} />}
      </DialogContent>
      {challan && (
        <DialogActions sx={{ pt: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={actions.isBusy(challan, 'print') ? <CircularProgress size={16} /> : <PrintOutlinedIcon />}
            onClick={() => actions.print(challan)}
            disabled={actions.isBusy(challan, 'print')}
          >
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={actions.isBusy(challan, 'pdf') ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfOutlinedIcon />}
            onClick={() => actions.downloadPdf(challan)}
            disabled={actions.isBusy(challan, 'pdf')}
          >
            Download PDF
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
