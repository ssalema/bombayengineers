import { Box, Breadcrumbs, Link, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';

/** Page heading: breadcrumbs, title, subtitle and actions. */
export function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-end' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {breadcrumbs?.length > 0 && (
          <Breadcrumbs separator={<NavigateNextRoundedIcon fontSize="small" />} sx={{ mb: 0.75, typography: 'body2' }}>
            {breadcrumbs.map((crumb, i) =>
              crumb.to ? (
                <Link key={i} component={RouterLink} to={crumb.to} underline="hover" color="text.secondary">
                  {crumb.label}
                </Link>
              ) : (
                <Typography key={i} variant="body2" color="text.primary" sx={{ fontWeight: 600 }} noWrap>
                  {crumb.label}
                </Typography>
              ),
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: { xs: 'stretch', sm: 'flex-end' }, '& > *': { flex: { xs: 1, sm: 'none' } } }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
