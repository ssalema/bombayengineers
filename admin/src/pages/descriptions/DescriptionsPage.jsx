import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Button, Card, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import { descriptionApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchField } from '../../components/common/SearchField';
import { PaginationBar } from '../../components/common/PaginationBar';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ActionIconButton, RowActions } from '../../components/common/ActionIconButton';
import { EmptyState, ErrorState, TableMessageRow, TableSkeletonRows } from '../../components/common/TableStates';
import { useListParams } from '../../hooks/useListParams';
import { formatDate, formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { DescriptionFormDialog } from './DescriptionFormDialog';

const COLUMNS = 3;

export default function DescriptionsPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const params = useListParams();
  const [formState, setFormState] = useState({ open: false, description: null });
  const [toDelete, setToDelete] = useState(null);

  const apiParams = { page: params.page, limit: params.limit, search: params.search };
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.descriptions.list(apiParams),
    queryFn: () => descriptionApi.list(apiParams),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const { setPage } = params;
  useEffect(() => {
    if (meta && params.page > meta.totalPages && meta.total > 0) setPage(meta.totalPages);
  }, [meta, params.page, setPage]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.descriptions.all });

  const deleteMutation = useMutation({
    mutationFn: (id) => descriptionApi.remove(id),
    onSuccess: async (res) => {
      await invalidate();
      enqueueSnackbar(res.message, { variant: 'success' });
    },
    onError: (err) => enqueueSnackbar(getErrorMessage(err), { variant: 'error' }),
    onSettled: () => setToDelete(null),
  });

  const openCreate = () => setFormState({ open: true, description: null });

  return (
    <>
      <PageHeader
        title="Descriptions"
        subtitle="Fixed item descriptions available in the challan dropdown."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Add description
          </Button>
        }
      />

      <Card sx={{ position: 'relative', overflow: 'hidden' }}>
        {isFetching && !isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} />}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: { xs: 2, sm: 2.5 }, justifyContent: 'space-between', alignItems: { sm: 'center' } }}>
          <SearchField value={params.search} onSearch={params.setSearch} placeholder="Search descriptions" />
          <Typography variant="body2" color="text.secondary">
            Total descriptions: <strong>{formatNumber(meta?.total)}</strong>
          </Typography>
        </Stack>

        <TableContainer sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Table sx={{ minWidth: 560 }} aria-label="Descriptions">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>Added on</TableCell>
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
                  {params.search ? (
                    <EmptyState
                      icon={FormatListBulletedRoundedIcon}
                      title="No descriptions match your search"
                      description="Try a different word or phrase."
                    />
                  ) : (
                    <EmptyState
                      icon={FormatListBulletedRoundedIcon}
                      title="No descriptions yet"
                      description="Descriptions you add here can be picked quickly while creating a challan."
                      action={
                        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
                          Add description
                        </Button>
                      }
                    />
                  )}
                </TableMessageRow>
              )}

              {!isLoading &&
                rows.map((d) => (
                  <TableRow key={d._id} hover>
                    <TableCell sx={{ fontWeight: 500, wordBreak: 'break-word' }}>{d.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', width: 160 }}>
                      {formatDate(d.createdAt)}
                    </TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      <RowActions>
                        <ActionIconButton title="Edit" ariaLabel={`Edit ${d.name}`} onClick={() => setFormState({ open: true, description: d })}>
                          <EditOutlinedIcon fontSize="small" />
                        </ActionIconButton>
                        <ActionIconButton title="Delete" ariaLabel={`Delete ${d.name}`} color="error" onClick={() => setToDelete(d)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </ActionIconButton>
                      </RowActions>
                    </TableCell>
                  </TableRow>
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

      <DescriptionFormDialog open={formState.open} description={formState.description} onClose={() => setFormState({ open: false, description: null })} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete description?"
        message={toDelete && `"${toDelete.name}" will be removed from the dropdown. Existing challans are not affected.`}
        confirmLabel="Delete description"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(toDelete._id)}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
