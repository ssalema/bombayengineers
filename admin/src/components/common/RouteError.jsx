import { Box, Button, Typography } from '@mui/material';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { useRouteError } from 'react-router';

export function RouteError({ inline = false }) {
  const error = useRouteError();
  // A failed lazy chunk usually means a new deployment; a reload fetches fresh assets.
  const isChunkError = /dynamically imported module|Failed to fetch/i.test(error?.message ?? '');

  return (
    <Box
      sx={{
        // Inline errors fill the layout's content area, not the whole viewport.
        minHeight: inline ? 360 : '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Box sx={{ maxWidth: 420 }}>
        <ErrorOutlineRoundedIcon color="error" sx={{ fontSize: 56, mb: 1 }} />
        <Typography variant="h5" gutterBottom>
          {isChunkError ? 'A new version is available' : 'Something went wrong'}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {isChunkError
            ? 'Please reload the page to continue.'
            : 'An unexpected error occurred while loading this page.'}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </Box>
    </Box>
  );
}
