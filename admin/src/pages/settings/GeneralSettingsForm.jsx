import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Box, Button, Card, CircularProgress, Divider, InputAdornment, Slide, TextField, Typography } from '@mui/material';
import { settingsApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { applyServerErrors, getErrorMessage } from '../../utils/errors';
import { toLocalMobile } from '../../utils/format';
import { shadow } from '../../theme/theme';
import { UnsavedChangesDialog } from '../../components/common/UnsavedChangesDialog';
import { BrandingSettings } from './BrandingSettings';

const ASSETS = ['logo', 'favicon'];
const NO_PENDING = { logo: null, favicon: null };

const schema = z.object({
  siteName: z.string().trim().min(2, 'Business name must be at least 2 characters').max(120),
  tagline: z.string().trim().max(160, 'Tagline is too long'),
  contactNumber: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{10}$/.test(v), 'Enter a valid 10-digit number'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address').max(120)]),
  address: z.string().trim().max(500, 'Address is too long'),
});

const revokePreview = (p) => p?.preview && URL.revokeObjectURL(p.preview);

/** General tab: business details + branding, saved together. */
export function GeneralSettingsForm({ settings }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [pending, setPending] = useState(NO_PENDING);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema) });

  const resetForm = () =>
    reset({
      siteName: settings.siteName ?? '',
      tagline: settings.tagline ?? '',
      contactNumber: toLocalMobile(settings.contactNumber ?? ''),
      email: settings.email ?? '',
      address: settings.address ?? '',
    });

  useEffect(resetForm, [settings, reset]);

  const clearPending = (asset) =>
    setPending((prev) => {
      revokePreview(prev[asset]);
      return { ...prev, [asset]: null };
    });

  const handlePick = (asset, file) =>
    setPending((prev) => {
      revokePreview(prev[asset]);
      return { ...prev, [asset]: { file, preview: URL.createObjectURL(file) } };
    });

  const handleRemove = (asset) => {
    if (pending[asset] && pending[asset] !== 'remove' && !settings[asset]?.url) clearPending(asset);
    else
      setPending((prev) => {
        revokePreview(prev[asset]);
        return { ...prev, [asset]: 'remove' };
      });
  };

  const hasPendingAssets = ASSETS.some((a) => pending[a]);
  const hasChanges = isDirty || hasPendingAssets;

  // Steps run in order; each success is cached so a later failure keeps earlier progress.
  const mutation = useMutation({
    mutationFn: async ({ contactNumber, ...rest }) => {
      if (isDirty) {
        const res = await settingsApi.update({ ...rest, contactNumber: contactNumber ? `+91 ${contactNumber}` : '' });
        queryClient.setQueryData(queryKeys.settings, res.data);
      }
      for (const asset of ASSETS) {
        const change = pending[asset];
        if (!change) continue;
        const res = change === 'remove' ? await settingsApi.removeAsset(asset) : await settingsApi.uploadAsset(asset, change.file);
        queryClient.setQueryData(queryKeys.settings, res.data);
        clearPending(asset);
      }
    },
    onSuccess: () => enqueueSnackbar('Settings saved', { variant: 'success' }),
    onError: (error) => {
      if (!applyServerErrors(error, setError)) enqueueSnackbar(getErrorMessage(error, 'Could not save settings'), { variant: 'error' });
    },
  });

  const discard = () => {
    resetForm();
    ASSETS.forEach(clearPending);
  };

  const saving = mutation.isPending;

  return (
    <Box component="form" noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))}>
      <Box sx={{ display: 'grid', gap: { xs: 2, sm: 2.5 }, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(0, 1fr)' }, alignItems: 'stretch' }}>
        <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%' }}>
          <Typography variant="subtitle1" component="h2">
            General information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your business details. The name appears in the sidebar, the login page and the browser tab.
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <TextField label="Business name" required error={Boolean(errors.siteName)} helperText={errors.siteName?.message} {...register('siteName')} />
            <TextField label="Tagline" error={Boolean(errors.tagline)} helperText={errors.tagline?.message} {...register('tagline')} />
            <TextField label="Email" type="email" error={Boolean(errors.email)} helperText={errors.email?.message} {...register('email')} />
            <TextField
              label="Contact number"
              type="tel"
              placeholder="9876543210"
              error={Boolean(errors.contactNumber)}
              helperText={errors.contactNumber?.message}
              {...register('contactNumber', {
                onChange: (e) => {
                  e.target.value = toLocalMobile(e.target.value).slice(0, 10);
                },
              })}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'stretch', height: 'auto', maxHeight: 'none', m: 0, mr: 1.5, pr: 1.5, borderRight: '1px solid', borderColor: 'divider' }}>
                      +91
                    </InputAdornment>
                  ),
                },
                // No maxLength: pasted "+91 98765 43210" is trimmed to 10 digits in onChange.
                htmlInput: { inputMode: 'numeric' },
              }}
            />
            <TextField label="Address" multiline minRows={3} error={Boolean(errors.address)} helperText={errors.address?.message} {...register('address')} />
          </Box>
        </Card>

        <BrandingSettings settings={settings} pending={pending} disabled={saving} onPick={handlePick} onRemove={handleRemove} />
      </Box>

      <Slide direction="up" in={hasChanges || saving} mountOnEnter unmountOnExit>
        <Card
          role="status"
          sx={{
            position: 'sticky',
            bottom: { xs: 12, sm: 16 },
            zIndex: (t) => t.zIndex.appBar - 1,
            mt: 2.5,
            px: { xs: 2, sm: 2.5 },
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            boxShadow: shadow.floating,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            You have unsaved changes.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button variant="outlined" color="inherit" onClick={discard} disabled={saving}>
              Discard changes
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            >
              Save changes
            </Button>
          </Box>
        </Card>
      </Slide>

      <UnsavedChangesDialog when={hasChanges && !saving} message="Your settings changes have not been saved. If you leave now, they will be lost." />
    </Box>
  );
}
