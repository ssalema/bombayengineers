import { NavLink, useLocation } from 'react-router';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { brand, radius } from '../../theme/theme';
import { ROUTES } from '../../config/constants';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { BrandLogo } from '../common/BrandLogo';

export const SIDEBAR_WIDTH = 264;

const NAV_ITEMS = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: SpaceDashboardRoundedIcon, end: true },
  { label: 'Challans', to: ROUTES.CHALLANS, icon: ReceiptLongRoundedIcon },
  { label: 'Clients', to: ROUTES.CLIENTS, icon: GroupsRoundedIcon },
  { label: 'Descriptions', to: ROUTES.DESCRIPTIONS, icon: FormatListBulletedRoundedIcon },
  { label: 'Settings', to: ROUTES.SETTINGS, icon: SettingsRoundedIcon },
];

export function Sidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const { logoUrl, siteName, isLoading } = useSiteSettings();

  const isActive = (item) => (item.end ? pathname === item.to : pathname.startsWith(item.to));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: brand.dark, color: '#fff' }}>
      {(logoUrl || siteName || isLoading) && (
        <Box sx={{ px: 2.5, pt: 2.5, pb: 2 }}>
          <Box
            sx={{
              bgcolor: '#fff',
              borderRadius: radius.lg,
              px: 0.75,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 52,
            }}
          >
            <BrandLogo height={56} sx={{ width: '100%' }} />
          </Box>
        </Box>
      )}

      <List sx={{ px: 1.5, pt: 1, flexGrow: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.to}
              component={NavLink}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              sx={{
                mb: 0.5,
                py: 1.1,
                px: 1.5,
                color: active ? '#fff' : alpha('#fff', 0.72),
                bgcolor: active ? alpha('#fff', 0.14) : 'transparent',
                position: 'relative',
                '&:hover': { bgcolor: alpha('#fff', active ? 0.18 : 0.08), color: '#fff' },
                '&::before': active
                  ? { content: '""', position: 'absolute', left: -12, top: 10, bottom: 10, width: 4, borderRadius: radius.pill, bgcolor: '#fff' }
                  : undefined,
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { variant: 'body2', fontWeight: active ? 600 : 500 } }} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha('#fff', 0.1)}` }}>
        <Typography variant="caption" sx={{ color: alpha('#fff', 0.55), display: 'block', lineHeight: 1.4 }}>
          {siteName ? `${siteName} ` : ''}Cash Challan Management System
        </Typography>
      </Box>
    </Box>
  );
}
