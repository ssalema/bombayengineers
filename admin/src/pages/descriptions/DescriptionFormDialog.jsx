import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { Box, Dialog, DialogContent, DialogTitle, TextField } from '@mui/material';
import { DialogCloseButton } from '../../components/common/DialogCloseButton';
import { DialogFooter } from '../../components/common/DialogFooter';
import { descriptionApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { applyServerErrors, getErrorMessage } from '../../utils/errors';

const schema = z.object({
  name: z.string().trim().min(1, 'Description is required').max(200, 'Description is too long'),
});

export function DescriptionFormDialog({ open, description, onClose }) {
  const isEdit = Boolean(description?._id);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: '' } });

  useEffect(() => {
    if (open) {
      reset({ name: description?.name ?? '' });
    }
  }, [open, description, reset]);

  const mutation = useMutation({
    mutationFn: (values) => (isEdit ? descriptionApi.update(description._id, values) : descriptionApi.create(values)),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.descriptions.all });
      enqueueSnackbar(res.message, { variant: 'success' });
      onClose();
    },
    onError: (error) => {
      if (!applyServerErrors(error, setError)) enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    },
  });

  return (
    <Dialog open={open} onClose={mutation.isPending ? undefined : onClose} maxWidth="sm" fullWidth aria-labelledby="description-form-title">
      <Box component="form" noValidate onSubmit={handleSubmit((v) => mutation.mutate(v))}>
        <DialogTitle id="description-form-title" sx={{ pr: 7 }}>{isEdit ? 'Edit description' : 'Add description'}</DialogTitle>
        <DialogCloseButton onClose={onClose} disabled={mutation.isPending} />
        <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '8px !important' }}>
          <TextField
            label="Description"
            autoFocus
            required
            multiline
            minRows={2}
            placeholder="e.g. Diamond Polishing Bench – 4 Seater"
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            {...register('name')}
          />
        </DialogContent>
        <DialogFooter submit confirmLabel={isEdit ? 'Save changes' : 'Add description'} loading={mutation.isPending} />
      </Box>
    </Dialog>
  );
}
