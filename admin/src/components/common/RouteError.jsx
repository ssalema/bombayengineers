import { Box, Button, Typography } from '@mui/material';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { fullViewportHeight, radius } from '../../theme/theme';

/** Turns whatever the router threw at us into a single readable line. */
function describeError(error) {
  if (!error) return '';
  if (isRouteErrorResponse(error)) {
    const detail = typeof error.data === 'string' ? error.data : error.data?.message;
    return [`${error.status} ${error.statusText}`, detail].filter(Boolean).join(' — ');
  }
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;
  return String(error);
}

export function RouteError({ inline = false }) {
  const error = useRouteError();
  // A failed lazy chunk usually means a new deployment; a reload fetches fresh assets.
  // Chrome/Firefox: "...dynamically imported module", Safari: "Importing a module script failed."
  const isChunkError = /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(error?.message ?? '');
  const detail = isChunkError ? '' : describeError(error);
  // Stacks are noise for users but the first thing we want when debugging locally.
  const stack = import.meta.env.DEV ? error?.stack : null;

  return (
    <Box
      sx={{
        // Inline errors fill the layout's content area, not the whole viewport.
        ...(inline ? { minHeight: 360 } : fullViewportHeight),
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
        <Typography color="text.secondary" sx={{ mb: detail ? 2 : 3 }}>
          {isChunkError
            ? 'Please reload the page to continue.'
            : 'An unexpected error occurred while loading this page.'}
        </Typography>
        {detail && (
          <Box
            sx={{
              mb: 3,
              px: 1.5,
              py: 1.25,
              textAlign: 'left',
              borderRadius: radius.md,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'surface.muted',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              {detail}
            </Typography>
            {stack && (
              <Typography
                variant="caption"
                component="pre"
                color="text.secondary"
                sx={{ mt: 1, mb: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {stack}
              </Typography>
            )}
          </Box>
        )}
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </Box>
    </Box>
  );
}
