import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Box, Dialog, DialogContent, DialogTitle, InputAdornment, TextField } from '@mui/material';
import { DialogCloseButton } from '../../components/common/DialogCloseButton';
import { DialogFooter } from '../../components/common/DialogFooter';
import { clientApi } from '../../api/services';
import { toLocalMobile } from '../../utils/format';
import { queryKeys } from '../../api/queryKeys';
import { applyServerErrors, getErrorMessage } from '../../utils/errors';

const clientSchema = z.object({
  name: z.string().trim().min(2, 'Client name must be at least 2 characters').max(120, 'Client name is too long'),
  contactNumber: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit mobile number'),
});

/** Create or edit a client. `client` = null creates. Calls `onSaved(client)` on success. */
export function ClientFormDialog({ open, client, onClose, onSaved }) {
  const isEdit = Boolean(client?._id);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(clientSchema), defaultValues: { name: '', contactNumber: '' } });

  useEffect(() => {
    if (open) reset({ name: client?.name ?? '', contactNumber: toLocalMobile(client?.contactNumber ?? '') });
  }, [open, client, reset]);

  const mutation = useMutation({
    mutationFn: ({ contactNumber, ...rest }) => {
      const values = { ...rest, contactNumber: contactNumber ? `+91 ${contactNumber}` : '' };
      return isEdit ? clientApi.update(client._id, values) : clientApi.create(values);
    },
    onSuccess: async (res) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.clients.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
        // Client name is snapshotted onto challans; refresh them after a rename.
        isEdit && queryClient.invalidateQueries({ queryKey: queryKeys.challans.all }),
      ]);
      enqueueSnackbar(res.message, { variant: 'success' });
      onSaved?.(res.data);
      onClose();
    },
    onError: (error) => {
      if (!applyServerErrors(error, setError)) enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="xs" fullWidth aria-labelledby="client-form-title">
      <Box component="form" noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <DialogTitle id="client-form-title" sx={{ pr: 7 }}>{isEdit ? 'Edit client' : 'Add client'}</DialogTitle>
        <DialogCloseButton onClose={onClose} disabled={mutation.isPending} />
        <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '8px !important' }}>
          <TextField
            label="Client name (M/S)"
            autoFocus
            required
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register('name')}
          />
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
              input: { startAdornment: <InputAdornment position="start">+91</InputAdornment> },
              // No maxLength: pasted "+91 98765 43210" is trimmed to 10 digits in onChange.
              htmlInput: { inputMode: 'numeric' },
            }}
          />
        </DialogContent>
        <DialogFooter submit onCancel={onClose} confirmLabel={isEdit ? 'Save changes' : 'Add client'} loading={mutation.isPending} />
      </Box>
    </Dialog>
  );
}
