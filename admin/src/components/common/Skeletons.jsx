import { Box, Card, Divider, Skeleton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { brand, fullViewportHeight, radius } from '../../theme/theme';
import { SIDEBAR_WIDTH } from '../layout/Sidebar';
import { StatGrid } from './StatCard';

/** Page-shaped loading placeholders so content doesn't jump when it loads. */

function Status({ children, sx }) {
  return (
    <Box role="status" aria-live="polite" aria-busy="true" aria-label="Loading" sx={sx}>
      {children}
    </Box>
  );
}

export function PageHeaderSkeleton({ breadcrumbs = false, actions = 1, subtitle = true }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-end' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {breadcrumbs && <Skeleton width={140} height={20} sx={{ mb: 0.75 }} />}
        <Skeleton width="min(260px, 70%)" height={40} />
        {subtitle && <Skeleton width="min(380px, 90%)" height={24} sx={{ mt: 0.5 }} />}
      </Box>
      {actions > 0 && (
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {Array.from({ length: actions }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={36.5} sx={{ width: { xs: '100%', sm: 150 }, borderRadius: radius.md }} />
          ))}
        </Box>
      )}
    </Box>
  );
}

export function StatCardSkeleton() {
  return (
    <Card sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Skeleton width="60%" height={20} />
          <Skeleton width={120} height={40} />
          <Skeleton width={90} height={18} />
        </Box>
        <Skeleton variant="rounded" sx={{ width: { xs: 44, lg: 40, xl: 44 }, height: { xs: 44, lg: 40, xl: 44 }, borderRadius: radius.lg, flexShrink: 0 }} />
      </Box>
    </Card>
  );
}

export function StatGridSkeleton({ count = 4 }) {
  return (
    <StatGrid>
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </StatGrid>
  );
}

/** Card with a toolbar row, table rows and a pagination footer. */
export function TableCardSkeleton({ rows = 8, columns = 5, toolbar = true }) {
  return (
    <Card>
      {toolbar && (
        <Box sx={{ p: { xs: 2, sm: 2.5 }, display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="rounded" height={40} sx={{ width: '100%', maxWidth: { sm: 420 }, borderRadius: radius.md }} />
          <Skeleton variant="rounded" width={220} height={40} sx={{ borderRadius: radius.md }} />
        </Box>
      )}
      <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 3, px: 2.5, py: 1.5, bgcolor: 'surface.subtle' }}>
          {Array.from({ length: columns }, (_, c) => (
            <Skeleton key={c} width="55%" height={18} />
          ))}
        </Box>
        {Array.from({ length: rows }, (_, r) => (
          <Box
            key={r}
            sx={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 3, px: 2.5, py: 1.5, borderTop: 1, borderColor: 'divider' }}
          >
            {Array.from({ length: columns }, (__, c) => (
              <Skeleton key={c} width={c === 0 ? '60%' : '80%'} height={22} />
            ))}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', px: { xs: 2, sm: 2.5 }, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Skeleton width={220} height={38} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} variant="circular" width={34} height={34} />
          ))}
        </Box>
      </Box>
    </Card>
  );
}

export function ChartCardSkeleton({ height = 300 }) {
  return (
    <Card sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton width={160} height={26} />
          <Skeleton width={200} height={20} />
        </Box>
        <Skeleton variant="rounded" width={72} height={32} sx={{ borderRadius: radius.md }} />
      </Box>
      <Skeleton variant="rounded" height={height} />
    </Card>
  );
}

/** Two-column form cards, used by the General settings tab. */
export function SettingsFormSkeleton() {
  return (
    <Status sx={{ display: 'grid', gap: { xs: 2, sm: 2.5 }, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' } }}>
      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <Skeleton width={180} height={28} />
        <Skeleton width="70%" height={20} />
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: 'grid', gap: 2.5 }}>
          {[40, 40, 40, 40, 96].map((h, i) => (
            <Skeleton key={i} variant="rounded" height={h} sx={{ borderRadius: radius.md }} />
          ))}
        </Box>
      </Card>
      <Card sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column' }}>
        <Skeleton width={110} height={28} />
        <Divider sx={{ my: 2 }} />
        <Skeleton width={60} height={22} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" height={120} sx={{ borderRadius: radius.md, mb: 2 }} />
        <Skeleton width={70} height={22} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" sx={{ borderRadius: radius.md, flex: 1, minHeight: 110 }} />
      </Card>
    </Status>
  );
}

/* ---------- Route-level fallbacks ---------- */

export function DashboardSkeleton() {
  return (
    <Status>
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2 }, gridTemplateColumns: { xs: '1fr', lg: '1.6fr 1fr' }, mb: 3 }}>
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </Box>
      <TableCardSkeleton rows={5} columns={4} toolbar={false} />
    </Status>
  );
}

export function ChallanListPageSkeleton() {
  return (
    <Status>
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <TableCardSkeleton columns={5} />
    </Status>
  );
}

export function ClientsPageSkeleton() {
  return (
    <Status>
      <PageHeaderSkeleton />
      <TableCardSkeleton columns={6} />
    </Status>
  );
}

export function ClientDetailSkeleton() {
  return (
    <Status>
      <PageHeaderSkeleton breadcrumbs actions={2} subtitle={false} />
      <Card sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: '1 1 260px' }}>
          <Skeleton variant="circular" width={52} height={52} />
          <Box>
            <Skeleton width={90} height={18} />
            <Skeleton width={130} height={28} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: { xs: 2.5, sm: 5 } }}>
          {[0, 1, 2].map((i) => (
            <Box key={i}>
              <Skeleton width={70} height={18} />
              <Skeleton width={90} height={28} />
            </Box>
          ))}
        </Box>
      </Card>
      <StatGridSkeleton />
      <TableCardSkeleton columns={5} />
    </Status>
  );
}

export function DescriptionsPageSkeleton() {
  return (
    <Status>
      <PageHeaderSkeleton />
      <TableCardSkeleton columns={3} />
    </Status>
  );
}

export function CreateChallanSkeleton() {
  return (
    <Status>
      <PageHeaderSkeleton breadcrumbs />
      <Box sx={{ display: 'grid', gap: { xs: 2, sm: 2.5 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,7fr) minmax(0,5fr)' }, alignItems: 'start' }}>
        <Box sx={{ display: 'grid', gap: { xs: 2, sm: 2.5 } }}>
          <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Skeleton width={140} height={28} sx={{ mb: 2 }} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <Skeleton variant="rounded" height={40} sx={{ borderRadius: radius.md }} />
              <Skeleton variant="rounded" height={40} sx={{ borderRadius: radius.md }} />
              <Skeleton variant="rounded" height={40} sx={{ borderRadius: radius.md, gridColumn: { sm: '1 / -1' } }} />
            </Box>
          </Card>
          <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Skeleton width={80} height={28} sx={{ mb: 2 }} />
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={40} sx={{ borderRadius: radius.md, mb: 1.5 }} />
            ))}
            <Divider sx={{ my: 2.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Skeleton width="45%" />
              <Box>
                <Skeleton width={90} sx={{ ml: 'auto' }} />
                <Skeleton width={150} height={40} />
              </Box>
            </Box>
          </Card>
        </Box>
        <Card sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'surface.muted' }}>
          <Skeleton width={120} height={24} sx={{ mb: 1.5 }} />
          <Skeleton variant="rounded" sx={{ aspectRatio: '210 / 297', height: 'auto', width: '100%' }} />
        </Card>
      </Box>
    </Status>
  );
}

export function SettingsPageSkeleton() {
  return (
    <Status>
      <PageHeaderSkeleton actions={0} />
      <Card sx={{ mb: 2.5, px: 2, height: 56, display: 'flex', alignItems: 'center', gap: 3 }}>
        <Skeleton width={90} height={26} />
        <Skeleton width={150} height={26} />
      </Card>
      <SettingsFormSkeleton />
    </Status>
  );
}

export function SimplePageSkeleton() {
  return (
    <Status sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
      <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1 }}>
        <Skeleton width={140} height={80} />
        <Skeleton width={200} height={36} />
        <Skeleton width={320} height={22} sx={{ maxWidth: '80vw' }} />
        <Skeleton variant="rounded" width={170} height={36.5} sx={{ mt: 2, borderRadius: radius.md }} />
      </Box>
    </Status>
  );
}

/* ---------- Full-screen fallbacks (before the layout mounts) ---------- */

const onDark = alpha('#fff', 0.12);

/** Sidebar + top bar + dashboard content, shown while the session is being restored. */
export function AppShellSkeleton() {
  return (
    <Status sx={{ display: 'flex', ...fullViewportHeight, bgcolor: 'background.default' }}>
      <Box sx={{ display: { xs: 'none', lg: 'flex' }, flexDirection: 'column', width: SIDEBAR_WIDTH, flexShrink: 0, bgcolor: brand.dark, px: 2.5, pt: 2.5 }}>
        <Skeleton variant="rounded" height={52} sx={{ bgcolor: onDark, borderRadius: radius.lg, mb: 3 }} />
        {Array.from({ length: 5 }, (_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 0.5, py: 1.25 }}>
            <Skeleton variant="rounded" width={20} height={20} sx={{ bgcolor: onDark }} />
            <Skeleton width={i % 2 ? 90 : 110} height={20} sx={{ bgcolor: onDark }} />
          </Box>
        ))}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ height: { xs: 60, sm: 64 }, px: { xs: 2, sm: 3, lg: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Skeleton width={180} height={22} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="circular" width={34} height={34} />
            <Skeleton width={80} height={22} sx={{ display: { xs: 'none', sm: 'block' } }} />
          </Box>
        </Box>
        <Box sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, sm: 3 }, maxWidth: 1480, mx: 'auto' }}>
          <DashboardSkeleton />
        </Box>
      </Box>
    </Status>
  );
}

/** Split login layout, shown while checking whether a session already exists. */
export function LoginSkeleton() {
  return (
    <Status sx={{ ...fullViewportHeight, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' }, bgcolor: 'background.default' }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', p: 6, background: `linear-gradient(160deg, ${brand.main} 0%, ${brand.dark} 70%)` }}>
        <Skeleton variant="rounded" width={220} height={64} sx={{ bgcolor: onDark, borderRadius: radius.lg }} />
        <Box sx={{ maxWidth: 460 }}>
          <Skeleton height={56} sx={{ bgcolor: onDark }} />
          <Skeleton width="70%" height={56} sx={{ bgcolor: onDark, mb: 2 }} />
          <Skeleton width="90%" height={26} sx={{ bgcolor: onDark, mb: 4 }} />
          {[0, 1, 2].map((i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.75 }}>
              <Skeleton variant="rounded" width={36} height={36} sx={{ bgcolor: onDark, borderRadius: radius.md }} />
              <Skeleton width={240} height={24} sx={{ bgcolor: onDark }} />
            </Box>
          ))}
        </Box>
        <Skeleton width={120} height={20} sx={{ bgcolor: onDark }} />
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2.5, sm: 4 } }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Skeleton width={220} height={48} sx={{ mb: 1 }} />
          <Skeleton width={260} height={24} sx={{ mb: 4 }} />
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: radius.md }} />
            <Skeleton variant="rounded" height={56} sx={{ borderRadius: radius.md }} />
            <Skeleton variant="rounded" height={50} sx={{ borderRadius: radius.md, mt: 0.5 }} />
          </Box>
        </Box>
      </Box>
    </Status>
  );
}
