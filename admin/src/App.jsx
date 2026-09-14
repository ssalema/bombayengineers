import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { theme } from './theme/theme';
import { AuthProvider } from './context/AuthContext';
import { router } from './router';
import { useDocumentBranding } from './hooks/useSiteSettings';

function DocumentBranding() {
  useDocumentBranding();
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Every write invalidates affected queries, so data can stay fresh longer.
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (count, error) => {
        const status = error?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return count < 2;
      },
    },
    mutations: { retry: false },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={3500}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          preventDuplicate
        >
          <DocumentBranding />
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
