import { lazy, Suspense, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Box, Button, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { dashboardApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard, StatGrid } from '../../components/common/StatCard';
import { PeriodStepper } from '../../components/common/PeriodStepper';
import { ClickableRow } from '../../components/common/ClickableRow';
import { ActionIconButton, RowActions } from '../../components/common/ActionIconButton';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState, ErrorState, TableMessageRow, TableSkeletonRows } from '../../components/common/TableStates';
import { ChallanPreviewDialog } from '../../components/challan/ChallanPreviewDialog';
import { ChallanLanguageDialog } from '../../components/challan/ChallanLanguageDialog';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useChallanActions } from '../../hooks/useChallanActions';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { ROUTES } from '../../config/constants';
import { ChartCardSkeleton } from '../../components/common/Skeletons';

// Load the charts library separately so stats and the table render first.
const CashBarChart = lazy(() => import('./CashBarChart').then((m) => ({ default: m.CashBarChart })));

// Usernames can carry a suffix (e.g. 'umar_be'); greet with just the name part.
const greetingName = (username) => {
  const name = username.split(/[._-]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
  const { siteName } = useSiteSettings();
  const { user } = useAuth();
  const actions = useChallanActions();
  const [year, setYear] = useState(dayjs().year());
  const [previewId, setPreviewId] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const overview = useQuery({ queryKey: queryKeys.dashboard.overview, queryFn: () => dashboardApi.overview().then((r) => r.data) });

  const monthly = useQuery({
    queryKey: queryKeys.dashboard.monthly(year),
    queryFn: () => dashboardApi.monthly(year).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  // "This month" is the current month, regardless of the chart's year.
  const currentMonthly = useQuery({
    queryKey: queryKeys.dashboard.monthly(dayjs().year()),
    queryFn: () => dashboardApi.monthly(dayjs().year()).then((r) => r.data),
  });
  const thisMonth = currentMonthly.data?.months?.[dayjs().month()];

  const o = overview.data;
  const monthlyPoints = (monthly.data?.months ?? []).map((m) => ({ label: MONTH_LABELS[m.month - 1], amount: m.amount, count: m.count }));
  const yearlyPoints = (o?.yearly ?? []).slice(-8).map((y) => ({ label: String(y.year), amount: y.amount, count: y.count }));
  if (o && yearlyPoints.length === 0) yearlyPoints.push({ label: String(dayjs().year()), amount: 0, count: 0 });

  const confirmDelete = async () => {
    try {
      await actions.remove(toDelete._id);
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title={user?.username ? `Welcome, ${greetingName(user.username)}` : 'Welcome'}
        subtitle={`Here is an overview of your ${siteName ? `${siteName} ` : ''}challans.`}
        actions={
          <Button component={RouterLink} to={ROUTES.CHALLAN_CREATE} variant="contained" startIcon={<AddRoundedIcon />}>
            Create challan
          </Button>
        }
      />

      {overview.error && (
        <Card sx={{ mb: 3 }}>
          <ErrorState message={getErrorMessage(overview.error)} onRetry={overview.refetch} />
        </Card>
      )}

      <StatGrid>
        <StatCard label="Total amount" value={formatCurrency(o?.totalAmount)} helper="All time" icon={AccountBalanceWalletOutlinedIcon} loading={overview.isLoading} />
        <StatCard label="Total challans" value={formatNumber(o?.totalChallans)} helper="Challans created" icon={ReceiptLongOutlinedIcon} tone="info" loading={overview.isLoading} />
        <StatCard label="Total clients" value={formatNumber(o?.totalClients)} helper="Registered clients" icon={GroupsOutlinedIcon} tone="success" loading={overview.isLoading} />
        <StatCard
          label="Current month"
          value={formatCurrency(thisMonth?.amount)}
          helper={`${formatNumber(thisMonth?.count)} challans in ${dayjs().format('MMMM')}`}
          icon={CalendarMonthOutlinedIcon}
          tone="warning"
          loading={currentMonthly.isLoading}
        />
      </StatGrid>

      <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2 }, gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' }, mb: 3 }}>
        <Suspense
          fallback={
            <>
              <ChartCardSkeleton />
              <ChartCardSkeleton />
            </>
          }
        >
          <CashBarChart
            title="Monthly amount"
            subtitle={`Total ${formatCurrency(monthly.data?.totalAmount)} in ${year}`}
            points={monthlyPoints}
            loading={monthly.isLoading}
            action={
              <PeriodStepper
                label={year}
                prevLabel="Previous year"
                nextLabel="Next year"
                onPrev={() => setYear(year - 1)}
                onNext={() => setYear(year + 1)}
                nextDisabled={year >= dayjs().year()}
              />
            }
          />
          <CashBarChart
            title="Yearly amount"
            subtitle="Total amount per year"
            points={yearlyPoints}
            loading={overview.isLoading}
          />
        </Suspense>
      </Box>

      <Card>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, sm: 2.5 }, py: 2 }}>
          <Box>
            <Typography variant="subtitle1" component="h2">
              Recent challans
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest challans created
            </Typography>
          </Box>
          <Button component={RouterLink} to={`${ROUTES.CHALLANS}?period=all`} endIcon={<ArrowForwardRoundedIcon />} size="small">
            View all
          </Button>
        </Box>
        <TableContainer sx={{ borderTop: 1, borderColor: 'divider' }}>
          <Table
            sx={{
              minWidth: 820,
              tableLayout: 'fixed',
              '& .MuiTableCell-root:first-of-type': { pl: { xs: 2, sm: 2.5 } },
              '& .MuiTableCell-root:last-of-type': { pr: { xs: 2, sm: 2.5 } },
            }}
            aria-label="Recent challans"
          >
            {/* Date and actions are sized in px so "11 Sep 2026, 06:52 PM" and the three buttons never overflow. */}
            <colgroup>
              <col style={{ width: '18%' }} />
              <col />
              <col style={{ width: '16%' }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 158 }} />
            </colgroup>
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
              {overview.isLoading && <TableSkeletonRows rows={5} columns={5} />}
              {o && o.recentChallans.length === 0 && (
                <TableMessageRow columns={5}>
                  <EmptyState
                    icon={ReceiptLongOutlinedIcon}
                    title="No challans yet"
                    description="Create your first delivery challan to see it here."
                    action={
                      <Button component={RouterLink} to={ROUTES.CHALLAN_CREATE} variant="contained" startIcon={<AddRoundedIcon />}>
                        Create challan
                      </Button>
                    }
                  />
                </TableMessageRow>
              )}
              {o?.recentChallans.map((c) => (
                <ClickableRow key={c._id} onOpen={() => setPreviewId(c._id)} label={`Preview challan ${c.challanNo}`}>
                  <TableCell>
                    <Typography
                      component="span"
                      sx={{ fontWeight: 600, color: 'primary.main', fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' }}
                    >
                      {c.challanNo}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography noWrap sx={{ fontWeight: 500 }} title={c.clientName}>
                      {c.clientName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {formatCurrency(c.totalAmount)}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDateTime(c.date)}
                  </TableCell>
                  <TableCell align="right">
                    <RowActions>
                      <ActionIconButton
                        title="Download PDF"
                        ariaLabel={`Download PDF of ${c.challanNo}`}
                        onClick={() => actions.downloadPdf(c)}
                        loading={actions.isBusy(c, 'pdf')}
                        color="primary"
                      >
                        <PictureAsPdfOutlinedIcon fontSize="small" />
                      </ActionIconButton>
                      <ActionIconButton title="Print" ariaLabel={`Print ${c.challanNo}`} onClick={() => actions.print(c)} loading={actions.isBusy(c, 'print')} color="info">
                        <PrintOutlinedIcon fontSize="small" />
                      </ActionIconButton>
                      <ActionIconButton title="Delete" ariaLabel={`Delete ${c.challanNo}`} onClick={() => setToDelete(c)} color="error">
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </ActionIconButton>
                    </RowActions>
                  </TableCell>
                </ClickableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
      <ChallanLanguageDialog {...actions.languagePrompt} />
    </>
  );
}
