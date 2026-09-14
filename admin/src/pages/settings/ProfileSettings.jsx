import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Avatar, Box, Button, Card, CircularProgress, IconButton, InputAdornment, TextField, Tooltip, Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { authApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { applyServerErrors, getErrorMessage } from '../../utils/errors';
import { initials } from '../../utils/format';
import { radius } from '../../theme/theme';

const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const AVATAR_MAX_SIZE = 2 * 1024 * 1024;

const usernameSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9._-]+$/i, 'Only letters, numbers, dot, underscore and hyphen'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .max(72, 'At most 72 characters')
      .regex(/[A-Za-z]/, 'Must contain a letter')
      .regex(/\d/, 'Must contain a number'),
    confirmPassword: z.string().min(1, 'Please confirm the new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ['newPassword'], message: 'Must differ from current password' });

const RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'Contains a letter', test: (v) => /[A-Za-z]/.test(v) },
  { label: 'Contains a number', test: (v) => /\d/.test(v) },
];

function PasswordField({ label, error, registration, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      label={label}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      error={Boolean(error)}
      helperText={error?.message}
      {...registration}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setVisible((v) => !v)} edge="end" aria-label={visible ? 'Hide password' : 'Show password'}>
                {visible ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

function AvatarField() {
  const { user, applySession } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const inputRef = useRef(null);

  const onSuccess = (res) => {
    applySession(res.data);
    enqueueSnackbar(res.message, { variant: 'success' });
  };
  const onError = (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
  const [progress, setProgress] = useState(0);
  const upload = useMutation({
    mutationFn: (file) => authApi.uploadAvatar(file, setProgress),
    onMutate: () => setProgress(0),
    onSuccess,
    onError,
  });
  const remove = useMutation({ mutationFn: authApi.removeAvatar, onSuccess, onError });
  const busy = upload.isPending || remove.isPending;
  const photo = user?.avatar?.url;

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) {
      enqueueSnackbar('Use a PNG, JPG or WEBP image', { variant: 'warning' });
      return;
    }
    if (file.size > AVATAR_MAX_SIZE) {
      enqueueSnackbar('File must be 2 MB or smaller', { variant: 'warning' });
      return;
    }
    upload.mutate(file);
  };

  const openPicker = () => !busy && inputRef.current?.click();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
      <input ref={inputRef} type="file" hidden accept={AVATAR_TYPES.join(',')} onChange={handleFile} />
      <Tooltip title={photo ? 'Change photo' : 'Upload photo'} placement="top">
        <Box
          role="button"
          tabIndex={0}
          aria-label={photo ? 'Change profile photo' : 'Upload profile photo'}
          onClick={openPicker}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openPicker())}
          sx={{
            position: 'relative',
            width: 96,
            height: 96,
            flexShrink: 0,
            borderRadius: radius.round,
            cursor: busy ? 'default' : 'pointer',
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            '&:hover .avatar-overlay': { opacity: busy ? 0 : 1 },
          }}
        >
          <Avatar src={photo || undefined} alt={user?.username} sx={{ width: '100%', height: '100%', bgcolor: 'primary.main', fontSize: 32, fontWeight: 700 }}>
            {initials(user?.username)}
          </Avatar>
          <Box
            className="avatar-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: radius.round,
              display: 'grid',
              placeItems: 'center',
              color: 'common.white',
              bgcolor: 'overlay.scrim',
              opacity: busy ? 1 : 0,
              transition: 'opacity .15s',
            }}
          >
            {busy ? (
              <Typography component="span" variant="h6" aria-live="polite" sx={{ fontWeight: 700, color: 'inherit' }}>
                {/* Hold at 99% until the server responds. */}
                {upload.isPending ? `${Math.min(progress, 99)}%` : '…'}
              </Typography>
            ) : (
              <PhotoCameraOutlinedIcon />
            )}
          </Box>
          {photo && !busy && (
            <IconButton
              size="small"
              color="error"
              aria-label="Remove profile photo"
              onClick={(e) => {
                e.stopPropagation();
                remove.mutate();
              }}
              sx={{
                position: 'absolute',
                bottom: -4,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Tooltip>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2">Profile photo</Typography>
        <Typography variant="caption" color="text.secondary">
          PNG, JPG or WEBP · max 2 MB
        </Typography>
      </Box>
    </Box>
  );
}

function UsernameCard() {
  const { user, applySession } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(usernameSchema), defaultValues: { username: user?.username ?? '' } });

  useEffect(() => {
    reset({ username: user?.username ?? '' });
  }, [user?.username, reset]);

  const mutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      applySession(res.data);
      enqueueSnackbar(res.message, { variant: 'success' });
    },
    onError: (error) => {
      if (!applyServerErrors(error, setError)) enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  return (
    <Card component="form" noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" component="h2">
        Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your photo and the username you use to sign in.
      </Typography>
      <AvatarField />
      <TextField label="Username" autoComplete="username" error={Boolean(errors.username)} helperText={errors.username?.message} {...register('username')} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 2.5 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!isDirty || mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Update username
        </Button>
      </Box>
    </Card>
  );
}

function PasswordCard() {
  const { applySession } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });
  const newPassword = useWatch({ control, name: 'newPassword' }) ?? '';

  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (res) => {
      applySession(res.data);
      reset();
      enqueueSnackbar('Password changed. Other devices have been signed out.', { variant: 'success' });
    },
    onError: (error) => {
      if (!applyServerErrors(error, setError)) enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  return (
    <Card component="form" noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))} sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" component="h2">
        Change password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Changing your password signs you out on all other devices.
      </Typography>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <PasswordField label="Current password" autoComplete="current-password" error={errors.currentPassword} registration={register('currentPassword')} />
        <PasswordField label="New password" autoComplete="new-password" error={errors.newPassword} registration={register('newPassword')} />
        <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword} registration={register('confirmPassword')} />
      </Box>

      <Box
        component="ul"
        sx={{ listStyle: 'none', p: 0, m: 0, mt: 1.5, display: 'flex', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.5 }}
        aria-label="Password requirements"
      >
        {RULES.map((rule) => {
          const ok = rule.test(newPassword);
          return (
            <Box component="li" key={rule.label} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: ok ? 'success.main' : 'text.secondary', typography: 'body2' }}>
              {ok ? <CheckCircleRoundedIcon sx={{ fontSize: 16 }} /> : <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 16 }} />}
              {rule.label}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 'auto', pt: 2.5 }}>
        <Button
          type="submit"
          variant="contained"
          disabled={!isDirty || mutation.isPending}
          startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Change password
        </Button>
      </Box>
    </Card>
  );
}

export function ProfileSettings() {
  return (
    <Box sx={{ display: 'grid', gap: { xs: 2, sm: 2.5 }, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'stretch' }}>
      <UsernameCard />
      <PasswordCard />
    </Box>
  );
}
