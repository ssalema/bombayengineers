import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AppBar, Avatar, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Toolbar, Typography,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../config/constants';
import { initials } from '../../utils/format';
import { radius } from '../../theme/theme';
import { alpha } from '@mui/material/styles';
import dayjs from 'dayjs';

export function Topbar({ onMenuClick, showMenuButton }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);

  const handleLogout = async () => {
    setAnchor(null);
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: (t) => alpha(t.palette.background.paper, 0.9), backdropFilter: 'blur(8px)' }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: { xs: 60, sm: 64 }, px: { xs: 2, sm: 3, lg: 4 } }}>
        {showMenuButton && (
          <IconButton edge="start" onClick={onMenuClick} aria-label="Open navigation menu">
            <MenuRoundedIcon />
          </IconButton>
        )}

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {dayjs().format('dddd, DD MMMM YYYY')}
          </Typography>
        </Box>

        <Box
          component="button"
          type="button"
          onClick={(e) => setAnchor(e.currentTarget)}
          aria-haspopup="menu"
          aria-label="Account menu"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            border: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            borderRadius: radius.md,
            px: 1,
            py: 0.5,
            font: 'inherit',
            color: 'inherit',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Avatar src={user?.avatar?.url || undefined} alt={user?.username} sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700 }}>
            {initials(user?.username)}
          </Avatar>
          <Typography variant="subtitle2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.username}
          </Typography>
          <KeyboardArrowDownRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
        </Box>

        <Menu
          anchorEl={anchor}
          open={Boolean(anchor)}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { sx: { minWidth: 200, mt: 1 } } }}
        >
          <MenuItem
            onClick={() => {
              setAnchor(null);
              navigate(`${ROUTES.SETTINGS}?tab=profile`);
            }}
          >
            <ListItemIcon>
              <PersonOutlineRoundedIcon fontSize="small" />
            </ListItemIcon>
            Profile and security
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'inherit' }}>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
