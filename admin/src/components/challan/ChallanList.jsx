import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  Button, Card, LinearProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { challanApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { useListParams } from '../../hooks/useListParams';
import { useChallanActions } from '../../hooks/useChallanActions';
import { resolveDateRange, describePeriod } from '../../utils/dateRange';
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { PERIODS, ROUTES } from '../../config/constants';
import { DateFilterBar } from '../common/DateFilterBar';
import { StatCard, StatGrid } from '../common/StatCard';
import { SearchField } from '../common/SearchField';
import { PaginationBar } from '../common/PaginationBar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ActionIconButton, RowActions } from '../common/ActionIconButton';
import { ClickableRow } from '../common/ClickableRow';
import { EmptyState, ErrorState, TableMessageRow, TableSkeletonRows } from '../common/TableStates';
import { ChallanPreviewDialog } from './ChallanPreviewDialog';

const COLUMNS = 5;

/** Challan listing with filters, summary, search and pagination. Pass `clientId` to scope it to one client. */
export function ChallanList({ clientId, defaultPeriod = PERIODS.MONTHLY }) {
  const params = useListParams({ withPeriod: true, defaultPeriod });
  const actions = useChallanActions();
  const [toDelete, setToDelete] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  const range = useMemo(
    () => resolveDateRange(params),
    [params.period, params.month, params.year, params.from, params.to], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const filters = { search: params.search, from: range.from, to: range.to, client: clientId };
  const apiParams = { ...filters, page: params.page, limit: params.limit, summary: false };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.challans.list(apiParams),
    queryFn: () => challanApi.list(apiParams),
    placeholderData: keepPreviousData,
  });

  // Totals depend only on filters, so paging doesn't refetch them.
  const summaryQuery = useQuery({
    queryKey: queryKeys.challans.summary(filters),
    queryFn: () => challanApi.summary(filters).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const summary = summaryQuery.data;
  const summaryLoading = summaryQuery.isLoading;
  const periodLabel = describePeriod(params);
  const createHref = clientId ? `${ROUTES.CHALLAN_CREATE}?client=${clientId}` : ROUTES.CHALLAN_CREATE;

  // Step back a page if its last row was deleted.
  const { setPage } = params;
  useEffect(() => {
    if (meta && params.page > meta.totalPages && meta.total > 0) setPage(meta.totalPages);
  }, [meta, params.page, setPage]);

  const confirmDelete = async () => {
    try {
      await actions.remove(toDelete._id);
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <StatGrid>
        <StatCard
          label="Total amount"
          value={formatCurrency(summary?.totalAmount)}
          helper={periodLabel}
          icon={AccountBalanceWalletOutlinedIcon}
          loading={summaryLoading}
        />
        <StatCard
          label="Total challans"
          value={formatNumber(summary?.count)}
          helper={periodLabel}
          icon={ReceiptLongOutlinedIcon}
          tone="info"
          loading={summaryLoading}
        />
        <StatCard
          label="Average per challan"
          value={formatCurrency(summary?.averageAmount)}
          helper="Mean challan amount"
          icon={TrendingUpRoundedIcon}
          tone="success"
          loading={summaryLoading}
        />
        {clientId ? (
          <StatCard
            label="Highest challan"
            value={formatCurrency(summary?.highestAmount)}
            helper="Largest single challan"
            icon={EmojiEventsOutlinedIcon}
            tone="warning"
            loading={summaryLoading}
          />
        ) : (
          <StatCard
            label="Active clients"
            value={formatNumber(summary?.clientCount)}
            helper="Clients with challans"
            icon={GroupsOutlinedIcon}
            tone="warning"
            loading={summaryLoading}
          />
        )}
      </StatGrid>

      <Card sx={{ position: 'relative', overflow: 'hidden' }}>
        {isFetching && !isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2 }} />}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ p: { xs: 2, sm: 2.5 }, alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <SearchField value={params.search} onSearch={params.setSearch} placeholder="Search challan no. or client"
            sx={{ flex: { md: 1 }, width: '100%', maxWidth: { sm: 520 } }}
          />
          <DateFilterBar value={params} onChange={params.setFilter} />
        </Stack>

        <TableContainer sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Table sx={{ minWidth: 760 }} aria-label="Challans">
            <TableHead>
              <TableRow>
                <TableCell>Challan number</TableCell>
                <TableCell>Client name</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Date &amp; time</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && <TableSkeletonRows rows={params.limit > 10 ? 10 : params.limit} columns={COLUMNS} />}

              {!isLoading && error && (
                <TableMessageRow columns={COLUMNS}>
                  <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
                </TableMessageRow>
              )}

              {!isLoading && !error && rows.length === 0 && (
                <TableMessageRow columns={COLUMNS}>
                  {params.search ? (
                    <EmptyState
                      icon={ReceiptLongOutlinedIcon}
                      title="No challans match your search"
                      description="Try a different challan number or client name."
                    />
                  ) : (
                    <EmptyState
                      icon={ReceiptLongOutlinedIcon}
                      title="No challans found"
                      description={`There are no challans for ${periodLabel.toLowerCase()}. Try another period or create a new challan.`}
                      action={
                        <Button component={RouterLink} to={createHref} variant="contained" startIcon={<AddRoundedIcon />}>
                          Create challan
                        </Button>
                      }
                    />
                  )}
                </TableMessageRow>
              )}

              {!isLoading &&
                rows.map((row) => (
                  <ClickableRow key={row._id} onOpen={() => setPreviewId(row._id)} label={`Preview challan ${row.challanNo}`}>
                    <TableCell>
                      <Typography
                        component="span"
                        sx={{ fontWeight: 600, color: 'primary.main', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}
                      >
                        {row.challanNo}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography noWrap sx={{ fontWeight: 500 }}>{row.clientName}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {formatCurrency(row.totalAmount)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{formatDateTime(row.date)}</TableCell>
                    <TableCell align="right">
                      <RowActions>
                        <ActionIconButton
                          title="Download PDF"
                          ariaLabel={`Download PDF of ${row.challanNo}`}
                          onClick={() => actions.downloadPdf(row)}
                          loading={actions.isBusy(row, 'pdf')}
                          color="primary"
                        >
                          <PictureAsPdfOutlinedIcon fontSize="small" />
                        </ActionIconButton>
                        <ActionIconButton title="Print" ariaLabel={`Print ${row.challanNo}`} onClick={() => actions.print(row)} loading={actions.isBusy(row, 'print')} color="info">
                          <PrintOutlinedIcon fontSize="small" />
                        </ActionIconButton>
                        <ActionIconButton title="Delete" ariaLabel={`Delete ${row.challanNo}`} onClick={() => setToDelete(row)} color="error">
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete challan?"
        message={
          toDelete &&
          `Challan ${toDelete.challanNo} for ${toDelete.clientName} (${formatCurrency(toDelete.totalAmount)}) will be permanently deleted. This cannot be undone.`
        }
        confirmLabel="Delete challan"
        loading={actions.isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />

      <ChallanPreviewDialog challanId={previewId} onClose={() => setPreviewId(null)} actions={actions} />
    </>
  );
}
