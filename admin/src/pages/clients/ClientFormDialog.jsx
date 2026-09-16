import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, InputAdornment, TextField, Tooltip } from '@mui/material';
import PermContactCalendarOutlinedIcon from '@mui/icons-material/PermContactCalendarOutlined';
import { DialogCloseButton } from '../../components/common/DialogCloseButton';
import { DialogFooter } from '../../components/common/DialogFooter';
import { ContactChoiceDialog } from '../../components/common/ContactChoiceDialog';
import { clientApi } from '../../api/services';
import { toLocalMobile } from '../../utils/format';
import { queryKeys } from '../../api/queryKeys';
import { applyServerErrors, getErrorMessage } from '../../utils/errors';
import { useContactPicker } from '../../hooks/useContactPicker';

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
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(clientSchema), defaultValues: { name: '', contactNumber: '' } });

  // `name` is uncontrolled (via `register`), so MUI can't see the value `setValue` writes
  // when a contact is picked and leaves the label sitting on top of the text.
  const nameValue = watch('name');

  const onPickerError = useCallback((message) => enqueueSnackbar(message, { variant: 'error' }), [enqueueSnackbar]);
  // Devices without a phonebook API say so on tap rather than hiding the button, so the
  // field looks the same everywhere and the reason is never a silent mystery.
  const onPickerUnavailable = useCallback((reason) => enqueueSnackbar(reason, { variant: 'info' }), [enqueueSnackbar]);
  // Set when the phonebook returns several numbers, so the user picks the one they meant.
  const [contactChoices, setContactChoices] = useState(null);
  const { pickContacts, picking, isSupported: canPickContact } = useContactPicker({
    onError: onPickerError,
    onUnavailable: onPickerUnavailable,
  });

  useEffect(() => {
    if (open) reset({ name: client?.name ?? '', contactNumber: toLocalMobile(client?.contactNumber ?? '') });
    else setContactChoices(null);
  }, [open, client, reset]);

  const handlePickContact = async () => {
    const candidates = await pickContacts();
    if (!candidates) return;
    if (candidates.length === 1) applyContact(candidates[0]);
    else setContactChoices(candidates);
  };

  const handleChooseContact = (contact) => {
    setContactChoices(null);
    applyContact(contact);
  };

  const applyContact = (contact) => {
    const mobile = toLocalMobile(contact.tel).slice(0, 10);
    if (!mobile) {
      enqueueSnackbar('That contact has no phone number. Enter it manually.', { variant: 'warning' });
      return;
    }
    // Validate on fill so a landline/short number from the phonebook flags immediately.
    setValue('contactNumber', mobile, { shouldValidate: true, shouldDirty: true });
    // Never clobber a name already typed — the number is what was asked for.
    const name = contact.name.slice(0, 120);
    if (name && !getValues('name').trim()) setValue('name', name, { shouldValidate: true, shouldDirty: true });
  };

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
            slotProps={{ inputLabel: { shrink: nameValue ? true : undefined } }}
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
              input: {
                startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                // Always shown; unsupported devices explain themselves on tap.
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={canPickContact ? 'Choose from contacts' : 'Phonebook not available on this device'}>
                      <span>
                        <IconButton
                          size="small"
                          edge="end"
                          aria-label="Choose contact number from phonebook"
                          disabled={picking || mutation.isPending}
                          onClick={handlePickContact}
                        >
                          {picking ? <CircularProgress size={18} color="inherit" /> : <PermContactCalendarOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              },
              // No maxLength: pasted "+91 98765 43210" is trimmed to 10 digits in onChange.
              htmlInput: { inputMode: 'numeric' },
            }}
          />
        </DialogContent>
        <DialogFooter submit confirmLabel={isEdit ? 'Save changes' : 'Add client'} loading={mutation.isPending} />
      </Box>
      <ContactChoiceDialog candidates={contactChoices} onChoose={handleChooseContact} onClose={() => setContactChoices(null)} />
    </Dialog>
  );
}
