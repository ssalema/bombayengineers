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
import { dashboardApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard, StatGrid } from '../../components/common/StatCard';
import { PeriodStepper } from '../../components/common/PeriodStepper';
import { ClickableRow } from '../../components/common/ClickableRow';
import { EmptyState, ErrorState, TableMessageRow, TableSkeletonRows } from '../../components/common/TableStates';
import { ChallanPreviewDialog } from '../../components/challan/ChallanPreviewDialog';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { useChallanActions } from '../../hooks/useChallanActions';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDateTime, formatNumber } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { ROUTES } from '../../config/constants';
import { ChartCardSkeleton } from '../../components/common/Skeletons';

// Load the charts library separately so stats and the table render first.
const CashBarChart = lazy(() => import('./CashBarChart').then((m) => ({ default: m.CashBarChart })));

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function DashboardPage() {
  const { siteName } = useSiteSettings();
  const { user } = useAuth();
  const actions = useChallanActions();
  const [year, setYear] = useState(dayjs().year());
  const [previewId, setPreviewId] = useState(null);

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

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'Admin'}`}
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
          label="This month"
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
              minWidth: 720,
              tableLayout: 'fixed',
              '& .MuiTableCell-root:first-of-type': { pl: { xs: 2, sm: 2.5 } },
              '& .MuiTableCell-root:last-of-type': { pr: { xs: 2, sm: 2.5 } },
            }}
            aria-label="Recent challans"
          >
            {/* Date column is sized in px so "11 Sep 2026, 06:52 PM" plus padding never overflows the cell. */}
            <colgroup>
              <col style={{ width: '20%' }} />
              <col />
              <col style={{ width: '20%' }} />
              <col style={{ width: 220 }} />
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell>Challan number</TableCell>
                <TableCell>Client name</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Date &amp; time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {overview.isLoading && <TableSkeletonRows rows={5} columns={4} />}
              {o && o.recentChallans.length === 0 && (
                <TableMessageRow columns={4}>
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
                  <TableCell sx={{ fontWeight: 600, color: 'primary.main', letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>{c.challanNo}</TableCell>
                  <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={c.clientName}>
                    {c.clientName}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {formatCurrency(c.totalAmount)}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDateTime(c.date)}
                  </TableCell>
                </ClickableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <ChallanPreviewDialog challanId={previewId} onClose={() => setPreviewId(null)} actions={actions} />
    </>
  );
}
