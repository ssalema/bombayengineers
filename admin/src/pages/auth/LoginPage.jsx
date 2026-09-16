import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert, Box, Button, CircularProgress, IconButton, InputAdornment, TextField, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { BrandLogo } from '../../components/common/BrandLogo';
import { getErrorMessage } from '../../utils/errors';
import { brand, fullViewportHeight, radius } from '../../theme/theme';

const schema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const HIGHLIGHTS = [
  { icon: ReceiptLongRoundedIcon, text: 'Auto-numbered delivery challans' },
  { icon: PrintRoundedIcon, text: 'A4 print with client & office copies' },
  { icon: InsightsRoundedIcon, text: 'Monthly and yearly cash insights' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { siteName, logoUrl, isLoading: settingsLoading } = useSiteSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { username: '', password: '' } });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await login(values);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to sign in'));
    }
  };

  const brandGradient = `linear-gradient(160deg, ${brand.main} 0%, ${brand.dark} 70%)`;

  return (
    <Box sx={{ ...fullViewportHeight, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' }, bgcolor: 'background.default' }}>
      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          color: '#fff',
          background: brandGradient,
        }}
      >
        {logoUrl || siteName || settingsLoading ? (
          <Box sx={{ bgcolor: '#fff', borderRadius: radius.xl, px: 1, py: 0.75, alignSelf: 'flex-start' }}>
            <BrandLogo height={52} sx={{ maxWidth: 340 }} />
          </Box>
        ) : (
          <Box />
        )}

        <Box sx={{ maxWidth: 460 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            {siteName ? `${siteName} - CCMS` : 'CCMS'}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: alpha('#fff', 0.78), fontWeight: 400, mb: 4 }}>
            Create, print and track every delivery challan{siteName ? ` for ${siteName}` : ''} from one place.
          </Typography>
          {HIGHLIGHTS.map(({ icon: Icon, text }) => (
            <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.75 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: radius.md, bgcolor: alpha('#fff', 0.14), display: 'grid', placeItems: 'center' }}>
                <Icon fontSize="small" />
              </Box>
              <Typography sx={{ color: alpha('#fff', 0.9) }}>{text}</Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="body2" sx={{ color: alpha('#fff', 0.55) }}>
          © {new Date().getFullYear()}{siteName ? ` ${siteName}` : ''}. All rights reserved.
        </Typography>
      </Box>

      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 4 },
          background: { xs: brandGradient, md: 'none' },
        }}
      >
        <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', width: '100%', maxWidth: 400, mb: 3 }}>
          <Box sx={{ bgcolor: '#fff', borderRadius: radius.xl, px: 1, py: 0.75 }}>
            <BrandLogo height={46} sx={{ maxWidth: '100%' }} />
          </Box>
        </Box>

        <Box
          sx={{
            width: '100%',
            maxWidth: 400,
            bgcolor: { xs: 'background.default', md: 'transparent' },
            borderRadius: { xs: radius.xl, md: 0 },
            p: { xs: 3, md: 0 },
            boxShadow: { xs: `0 20px 50px ${alpha('#000', 0.25)}`, md: 'none' },
          }}
        >

          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Sign in to manage your challans.
          </Typography>

          {formError && (
            <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setFormError('')}>
              {formError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'grid', gap: 2.5 }}>
            <TextField
              label="Username"
              autoComplete="username"
              autoFocus
              size="medium"
              error={Boolean(errors.username)}
              helperText={errors.username?.message}
              {...register('username')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              size="medium"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              {...register('password')}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.4, mt: 0.5 }}
              startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ display: { xs: 'block', md: 'none' }, mt: 3, color: alpha('#fff', 0.55) }}>
          © {new Date().getFullYear()}{siteName ? ` ${siteName}` : ''}. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
