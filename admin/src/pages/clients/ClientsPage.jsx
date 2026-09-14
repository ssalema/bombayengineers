import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Avatar, Box, Button, Card, LinearProgress, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { clientApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchField } from '../../components/common/SearchField';
import { PaginationBar } from '../../components/common/PaginationBar';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState, ErrorState, TableMessageRow, TableSkeletonRows } from '../../components/common/TableStates';
import { ActionIconButton, RowActions } from '../../components/common/ActionIconButton';
import { ClickableRow } from '../../components/common/ClickableRow';
import { useListParams } from '../../hooks/useListParams';
import { EMPTY_VALUE, formatCurrency, formatDate, formatNumber, formatPhone, initials } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { ROUTES } from '../../config/constants';
import { ClientFormDialog } from './ClientFormDialog';

const COLUMNS = 6;

export default function ClientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const params = useListParams();
  const [formState, setFormState] = useState({ open: false, client: null });
  const [toDelete, setToDelete] = useState(null);

  const apiParams = { page: params.page, limit: params.limit, search: params.search };
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.clients.list(apiParams),
    queryFn: () => clientApi.list(apiParams),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const { setPage } = params;
  useEffect(() => {
    if (meta && params.page > meta.totalPages && meta.total > 0) setPage(meta.totalPages);
  }, [meta, params.page, setPage]);

  const deleteMutation = useMutation({
    mutationFn: (id) => clientApi.remove(id),
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
      ]);
      enqueueSnackbar(res.message, { variant: 'success' });
      setToDelete(null);
    },
    onError: (err) => {
      enqueueSnackbar(getErrorMessage(err), { variant: 'error' });
      setToDelete(null);
    },
  });

  const openDetail = (client) => navigate(ROUTES.clientDetail(client._id));

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Manage clients and view their challan history."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setFormState({ open: true, client: null })}>
            Add client
          </Button>
        }
      />

      <Card sx={{ position: 'relative', overflow: 'hidden' }}>
        {isFetching && !isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} />}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: { xs: 2, sm: 2.5 }, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
          <SearchField value={params.search} onSearch={params.setSearch} placeholder="Search name or contact number" />
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Total clients: {isLoading ? <Skeleton width={32} /> : <strong>{formatNumber(meta?.total)}</strong>}
          </Typography>
        </Stack>

        <TableContainer sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Table sx={{ minWidth: 820 }} aria-label="Clients">
            <TableHead>
              <TableRow>
                <TableCell>Client name</TableCell>
                <TableCell>Contact number</TableCell>
                <TableCell align="right">Challans</TableCell>
                <TableCell align="right">Total amount</TableCell>
                <TableCell>Last challan</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeletonRows rows={Math.min(params.limit, 10)} columns={COLUMNS} />}
              {!isLoading && error && (
                <TableMessageRow columns={COLUMNS}>
                  <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
                </TableMessageRow>
              )}
              {!isLoading && !error && rows.length === 0 && (
                <TableMessageRow columns={COLUMNS}>
                  <EmptyState
                    icon={GroupsOutlinedIcon}
                    title={params.search ? 'No clients match your search' : 'No clients yet'}
                    description={params.search ? 'Try a different name or number.' : 'Add your first client to start creating challans.'}
                    action={
                      !params.search && (
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setFormState({ open: true, client: null })}>
                          Add client
                        </Button>
                      )
                    }
                  />
                </TableMessageRow>
              )}
              {!isLoading &&
                rows.map((client) => (
                  <ClickableRow key={client._id} onOpen={() => openDetail(client)} label={`View challans for ${client.name}`}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Avatar sx={{ width: 34, height: 34, fontSize: 14, fontWeight: 700, bgcolor: 'primary.main' }}>{initials(client.name)}</Avatar>
                        <Typography sx={{ fontWeight: 600, color: 'primary.main' }} noWrap>
                          {client.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: client.contactNumber ? 'text.primary' : 'text.disabled', whiteSpace: 'nowrap' }}>
                      {formatPhone(client.contactNumber) || EMPTY_VALUE}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(client.challanCount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {formatCurrency(client.totalAmount)}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatDate(client.lastChallanAt)}</TableCell>
                    <TableCell align="right">
                      <RowActions>
                        <ActionIconButton title="Edit" ariaLabel={`Edit ${client.name}`} onClick={() => setFormState({ open: true, client })}>
                          <EditOutlinedIcon fontSize="small" />
                        </ActionIconButton>
                        <ActionIconButton
                          title="Delete"
                          ariaLabel={`Delete ${client.name}`}
                          color="error"
                          disabled={client.challanCount > 0}
                          disabledReason="Clients with challans cannot be deleted"
                          onClick={() => setToDelete(client)}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </ActionIconButton>
                      </RowActions>
                    </TableCell>
                  </ClickableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <PaginationBar
          page={params.page}
          limit={params.limit}
          total={meta?.total ?? 0}
          onPageChange={params.setPage}
          onLimitChange={params.setLimit}
          disabled={isLoading}
        />
      </Card>

      <ClientFormDialog open={formState.open} client={formState.client} onClose={() => setFormState({ open: false, client: null })} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete client?"
        message={toDelete && `${toDelete.name} will be permanently removed.`}
        confirmLabel="Delete client"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(toDelete._id)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
