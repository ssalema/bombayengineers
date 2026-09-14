import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Box, Button, Card, Divider, Skeleton, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { clientApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { PageHeader } from '../../components/common/PageHeader';
import { ErrorState } from '../../components/common/TableStates';
import { ChallanList } from '../../components/challan/ChallanList';
import { EMPTY_VALUE, formatCurrency, formatDate, formatNumber, formatPhone, initials } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { PERIODS, ROUTES } from '../../config/constants';
import { ClientFormDialog } from './ClientFormDialog';

function Stat({ label, value, loading }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="overline" component="p" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} noWrap>
        {loading ? <Skeleton width={80} /> : value}
      </Typography>
    </Box>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const { data: client, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.clients.detail(id),
    queryFn: () => clientApi.get(id).then((r) => r.data),
  });

  if (error) {
    return (
      <Card>
        <ErrorState message={getErrorMessage(error)} onRetry={error.response?.status === 404 ? undefined : refetch} />
        <Box sx={{ textAlign: 'center', pb: 4 }}>
          <Button component={RouterLink} to={ROUTES.CLIENTS}>
            Back to clients
          </Button>
        </Box>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Clients', to: ROUTES.CLIENTS }, { label: isLoading ? <Skeleton width={120} /> : client.name }]}
        title={isLoading ? <Skeleton width={240} /> : client.name}
        actions={
          <>
            <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setEditOpen(true)} disabled={!client}>
              Edit client
            </Button>
            <Button component={RouterLink} to={`${ROUTES.CHALLAN_CREATE}?client=${id}`} variant="contained" startIcon={<AddRoundedIcon />}>
              Create challan
            </Button>
          </>
        }
      />

      {/* The title already shows the name, so this card shows only details. */}
      <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: '1 1 260px' }}>
            <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontWeight: 700 }}>{initials(client?.name)}</Avatar>
            <Stat label="Contact number" value={formatPhone(client?.contactNumber) || EMPTY_VALUE} loading={isLoading} />
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, auto))', gap: { xs: 2.5, sm: 5 } }}>
            <Stat label="Challans" value={formatNumber(client?.challanCount)} loading={isLoading} />
            <Stat label="Total amount" value={formatCurrency(client?.totalAmount)} loading={isLoading} />
            <Stat label="Client since" value={formatDate(client?.createdAt)} loading={isLoading} />
          </Box>
        </Box>
      </Card>

      <ChallanList clientId={id} defaultPeriod={PERIODS.YEARLY} />

      <ClientFormDialog open={editOpen} client={client} onClose={() => setEditOpen(false)} />
    </>
  );
}
