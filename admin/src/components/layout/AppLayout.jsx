import { useState } from 'react';
import { Outlet } from 'react-router';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar';
import { Topbar } from './Topbar';
import { fullViewportHeight } from '../../theme/theme';

export function AppLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', ...fullViewportHeight, bgcolor: 'background.default' }}>
      <Box component="nav" aria-label="Main navigation" sx={{ width: { lg: SIDEBAR_WIDTH }, flexShrink: { lg: 0 } }}>
        {isDesktop ? (
          <Drawer
            variant="permanent"
            open
            sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', borderRight: 0 } }}
          >
            <Sidebar />
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', borderRight: 0 } }}
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </Drawer>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar onMenuClick={() => setMobileOpen(true)} showMenuButton={!isDesktop} />
        <Box component="main" sx={{ flexGrow: 1, px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, sm: 3 }, maxWidth: 1480, width: '100%', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
