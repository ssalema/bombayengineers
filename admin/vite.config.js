import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Pre-bundle lazy deps so dev doesn't force-reload the page on first use.
    optimizeDeps: {
      entries: ['index.html', 'src/**/*.{js,jsx}'],
      include: ['jspdf', 'html2canvas-pro', '@mui/x-charts/BarChart'],
    },
    server: {
      port: 5173,
      // Same-origin proxy in development keeps the refresh cookie SameSite=Strict.
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            // Small shared libs; without this they'd land in the lazy charts/pickers chunks.
            if (/node_modules[\\/](dayjs|@babel[\\/]runtime|react-transition-group|dom-helpers)[\\/]/.test(id)) return 'mui';
            if (id.includes('@mui/x-charts') || id.includes('d3-')) return 'charts';
            // Keep dayjs out so the picker library isn't loaded up front.
            if (id.includes('@mui/x-date-pickers')) return 'pickers';
            if (id.includes('@mui') || id.includes('@emotion')) return 'mui';
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) return 'forms';
            if (/node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id) && !id.includes('server')) return 'react';
            // Everything else is split automatically by Rollup.
            return undefined;
          },
        },
      },
    },
  };
});
