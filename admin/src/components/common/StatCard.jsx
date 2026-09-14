import { Box, Card, Skeleton, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { radius } from '../../theme/theme';

/** KPI tile: label, value, optional helper text and icon badge (`tone` sets its colour). */
export function StatCard({ label, value, helper, icon: Icon, tone = 'primary', loading = false }) {
  return (
    <Card sx={{ p: { xs: 2, sm: 2.5 }, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }} noWrap>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={120} height={40} />
          ) : (
            <Typography variant="kpi" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
              {value}
            </Typography>
          )}
          {helper && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }} noWrap>
              {loading ? <Skeleton width={90} /> : helper}
            </Typography>
          )}
        </Box>
        {Icon && (
          <Box
            sx={(t) => ({
              width: { xs: 44, lg: 40, xl: 44 },
              height: { xs: 44, lg: 40, xl: 44 },
              borderRadius: radius.lg,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              color: t.palette[tone].main,
              bgcolor: alpha(t.palette[tone].main, 0.1),
            })}
          >
            <Icon />
          </Box>
        )}
      </Box>
    </Card>
  );
}

/** Responsive grid for stat cards: 1 → 2 → 4 columns. */
export function StatGrid({ children }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 1.5, sm: 2 },
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        mb: 3,
      }}
    >
      {children}
    </Box>
  );
}
