import { Link as RouterLink } from 'react-router';
import { Box, Button, Typography } from '@mui/material';
import { ROUTES } from '../config/constants';

export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <Box>
        <Typography variant="display" sx={{ color: 'primary.main' }}>404</Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>
          Page not found
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          The page you are looking for does not exist or was moved.
        </Typography>
        <Button component={RouterLink} to={ROUTES.DASHBOARD} variant="contained">
          Back to dashboard
        </Button>
      </Box>
    </Box>
  );
}
