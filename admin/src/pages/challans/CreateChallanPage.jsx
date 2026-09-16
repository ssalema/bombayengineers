import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Autocomplete, Box, Button, Card, CircularProgress, Dialog, DialogActions, DialogContent, Divider, InputAdornment, Skeleton, TextField,
  Tooltip, Typography,
} from '@mui/material';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { challanApi, clientApi, descriptionApi } from '../../api/services';
import { queryKeys } from '../../api/queryKeys';
import { DialogCloseButton } from '../../components/common/DialogCloseButton';
import { PageHeader } from '../../components/common/PageHeader';
import { UnsavedChangesDialog } from '../../components/common/UnsavedChangesDialog';
import { LocalizedDatePicker } from '../../components/common/LocalizedDatePicker';
import { ScaledChallanPreview } from '../../components/challan/ScaledChallanPreview';
import { useDebounce } from '../../hooks/useDebounce';
import { invalidateChallanData, useChallanActions } from '../../hooks/useChallanActions';
import { amountInWords } from '../../utils/amountInWords';
import { formatCurrency, formatPhone, roundMoney } from '../../utils/format';
import { getErrorMessage } from '../../utils/errors';
import { ROUTES } from '../../config/constants';
import { ClientFormDialog } from '../clients/ClientFormDialog';
import { ChallanItemsEditor, emptyItem } from './ChallanItemsEditor';
import { ChallanNotesEditor, emptyNote, NOTE_MAX_LENGTH, NOTES_MAX_COUNT } from './ChallanNotesEditor';

const itemSchema = z.object({
  description: z.string().trim().min(1, 'Description is required').max(300, 'Too long'),
  qty: z.string().refine((v) => Number(v) > 0, 'Must be > 0'),
  rate: z.string().refine((v) => v !== '' && Number(v) >= 0, 'Required'),
});

const schema = z.object({
  date: z
    .custom((v) => dayjs.isDayjs(v) && v.isValid(), 'Enter a valid date')
    .refine((v) => !v.isAfter(dayjs(), 'day'), 'Date cannot be in the future'),
  client: z.object({ _id: z.string(), name: z.string() }, { invalid_type_error: 'Select a client' }).nullable().refine(Boolean, 'Select a client'),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
  notes: z.array(z.object({ text: z.string().max(NOTE_MAX_LENGTH, 'Too long') })).max(NOTES_MAX_COUNT),
});

const defaultValues = () => ({ date: dayjs(), client: null, items: [emptyItem()], notes: [emptyNote()] });

const cleanNotes = (notes) => (notes ?? []).map((n) => n.text.trim()).filter(Boolean);

/** Uses the chosen day with the current time, so "Date & Time" reflects when it was issued. */
const toChallanDate = (day) => {
  const now = dayjs();
  return day.hour(now.hour()).minute(now.minute()).second(now.second()).toISOString();
};

const itemsTotal = (items) =>
  roundMoney((items ?? []).reduce((sum, i) => sum + roundMoney((Number(i.qty) || 0) * (Number(i.rate) || 0)), 0));

// Total and preview watch the items directly, so typing re-renders only them, not the whole form.
function ItemsTotal({ control }) {
  const items = useWatch({ control, name: 'items' });
  const totalAmount = useMemo(() => itemsTotal(items), [items]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', flex: '1 1 240px' }}>
        {amountInWords(totalAmount)}
      </Typography>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="body2" color="text.secondary">
          Total amount
        </Typography>
        <Typography variant="h5" component="p" sx={{ color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}>
          {formatCurrency(totalAmount)}
        </Typography>
      </Box>
    </Box>
  );
}

function DraftPreview({ control, challanNo }) {
  const [date, client, items, notes] = useWatch({ control, name: ['date', 'client', 'items', 'notes'] });
  const draft = useMemo(
    () => ({
      challanNo,
      date: date?.isValid?.() ? date.toISOString() : undefined,
      clientName: client?.name ?? '',
      client,
      items: (items ?? []).filter((i) => i.description || i.rate),
      notes: cleanNotes(notes),
    }),
    [challanNo, date, client, items, notes],
  );
  // The A4 preview is heavy: defer it so keystrokes paint first.
  const deferredDraft = useDeferredValue(draft);
  return <ScaledChallanPreview challan={deferredDraft} />;
}

export default function CreateChallanPage() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const actions = useChallanActions();

  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [savedChallan, setSavedChallan] = useState(null);
  const debouncedClientSearch = useDebounce(clientSearch, 300);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaultValues(), mode: 'onTouched' });

  const date = useWatch({ control, name: 'date' });
  const client = useWatch({ control, name: 'client' });

  const monthKey = date?.isValid?.() ? date.format('YYMM') : dayjs().format('YYMM');
  const nextNumber = useQuery({
    queryKey: queryKeys.challans.nextNumber(monthKey),
    queryFn: () => challanApi.nextNumber(toChallanDate(date?.isValid?.() ? date : dayjs())).then((r) => r.data.challanNo),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const clientOptions = useQuery({
    queryKey: queryKeys.clients.options(debouncedClientSearch),
    queryFn: () => clientApi.options(debouncedClientSearch).then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const descriptionOptions = useQuery({
    queryKey: queryKeys.descriptions.options,
    queryFn: () => descriptionApi.options().then((r) => r.data),
    // Changes rarely and every edit invalidates it.
    staleTime: 30 * 60 * 1000,
  });

  // Preselect a client when coming from a client page (?client=<id>).
  const preselectId = searchParams.get('client');
  useEffect(() => {
    if (!preselectId) return;
    queryClient
      .fetchQuery({ queryKey: queryKeys.clients.detail(preselectId), queryFn: () => clientApi.get(preselectId).then((r) => r.data) })
      .then((c) => setValue('client', { _id: c._id, name: c.name, contactNumber: c.contactNumber }, { shouldValidate: true }))
      .catch(() => {});
  }, [preselectId, setValue, queryClient]);

  const saveMutation = useMutation({
    mutationFn: (values) =>
      challanApi.create({
        date: toChallanDate(values.date),
        client: values.client._id,
        items: values.items.map((i) => ({ description: i.description.trim(), qty: Number(i.qty), rate: Number(i.rate) })),
        notes: cleanNotes(values.notes),
      }),
    onSuccess: async (res) => {
      await invalidateChallanData(queryClient);
      queryClient.setQueryData(queryKeys.challans.detail(res.data._id), res.data);
      reset(defaultValues());
      setSavedChallan(res.data);
    },
    onError: (error) => {
      enqueueSnackbar(getErrorMessage(error, 'Could not save challan'), { variant: 'error' });
      nextNumber.refetch();
    },
  });

  // The form is already reset on save, so dismissing just readies the next number.
  const closeSavedDialog = () => {
    setSavedChallan(null);
    nextNumber.refetch();
  };

  const onInvalid = () => enqueueSnackbar('Please fix the highlighted fields', { variant: 'warning' });

  const clientList = clientOptions.data ?? [];
  const options = client && !clientList.some((c) => c._id === client._id) ? [client, ...clientList] : clientList;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Challans', to: ROUTES.CHALLANS }, { label: 'Create challan' }]}
        title="Create challan"
        subtitle="Fill in the details. The preview updates as you type."
        actions={
          <Button
            variant="contained"
            startIcon={saveMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />}
            onClick={handleSubmit((v) => saveMutation.mutate(v), onInvalid)}
            disabled={saveMutation.isPending}
          >
            Save challan
          </Button>
        }
      />

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit((v) => saveMutation.mutate(v), onInvalid)}
        sx={{ display: 'grid', gap: { xs: 2, sm: 2.5 }, gridTemplateColumns: { xs: 'minmax(0,1fr)', lg: 'minmax(0,7fr) minmax(0,5fr)' }, alignItems: 'start' }}
      >
        <Box sx={{ display: 'grid', gap: { xs: 2, sm: 2.5 }, minWidth: 0 }}>
          <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Typography variant="subtitle1" component="h2" sx={{ mb: 2 }}>
              Challan details
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                label="Challan number"
                value={nextNumber.data ?? ''}
                slotProps={{
                  inputLabel: nextNumber.isLoading ? { shrink: true } : undefined,
                  input: {
                    readOnly: true,
                    'aria-busy': nextNumber.isLoading || undefined,
                    sx: { fontWeight: 700, letterSpacing: '0.04em', bgcolor: 'surface.muted' },
                    startAdornment: nextNumber.isLoading ? <Skeleton width={120} height={22} sx={{ flexShrink: 0 }} /> : undefined,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Generated automatically (BE + YYMM + sequence). The final number is confirmed when you save.">
                          <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.secondary', cursor: 'help' }} />
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Controller
                name="date"
                control={control}
                render={({ field, fieldState }) => (
                  <LocalizedDatePicker
                    label="Date"
                    value={field.value}
                    onChange={field.onChange}
                    maxDate={dayjs()}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: { fullWidth: true, size: 'small', error: Boolean(fieldState.error), helperText: fieldState.error?.message, onBlur: field.onBlur },
                    }}
                  />
                )}
              />
              <Box sx={{ gridColumn: { sm: '1 / -1' }, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Controller
                  name="client"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Autocomplete
                      fullWidth
                      value={field.value}
                      options={options}
                      loading={clientOptions.isFetching}
                      getOptionLabel={(o) => o?.name ?? ''}
                      isOptionEqualToValue={(o, v) => o._id === v._id}
                      filterOptions={(x) => x}
                      onChange={(_, value) => field.onChange(value ? { _id: value._id, name: value.name } : null)}
                      onInputChange={(_, value, reason) => reason === 'input' && setClientSearch(value)}
                      onBlur={field.onBlur}
                      noOptionsText={
                        <Button size="small" startIcon={<PersonAddAlt1OutlinedIcon />} onMouseDown={() => setClientDialogOpen(true)}>
                          Add client
                        </Button>
                      }
                      renderOption={(props, option) => {
                        const { key, ...rest } = props;
                        return (
                          <Box component="li" key={key} {...rest} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important' }}>
                            <Typography sx={{ fontWeight: 600 }}>{option.name}</Typography>
                            {option.contactNumber && (
                              <Typography variant="caption" color="text.secondary">
                                {formatPhone(option.contactNumber)}
                              </Typography>
                            )}
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          inputRef={field.ref}
                          label="Client name (M/S)"
                          required
                          placeholder="Search clients"
                          error={Boolean(fieldState.error)}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  )}
                />
                <Tooltip title="Add client">
                  <Button
                    variant="outlined"
                    onClick={() => setClientDialogOpen(true)}
                    aria-label="Add client"
                    sx={{ minWidth: 0, px: 1.25, height: 40, flexShrink: 0 }}
                  >
                    <PersonAddAlt1OutlinedIcon fontSize="small" />
                  </Button>
                </Tooltip>
              </Box>
            </Box>
          </Card>

          <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2, gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" component="h2">
                Items
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pick a saved description or type your own.
              </Typography>
            </Box>

            <ChallanItemsEditor
              control={control}
              descriptionOptions={descriptionOptions.data ?? []}
              arrayError={errors.items?.message || errors.items?.root?.message}
            />

            <Divider sx={{ my: 2.5 }} />

            <ItemsTotal control={control} />
          </Card>

          <Card sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2, gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" component="h2">
                Note
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Optional. Printed below the amount in words.
              </Typography>
            </Box>
            <ChallanNotesEditor control={control} />
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button component={RouterLink} to={ROUTES.CHALLANS} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={saveMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />}
              disabled={saveMutation.isPending}
            >
              Save challan
            </Button>
          </Box>
        </Box>

        <Card sx={{ p: { xs: 1.5, sm: 2 }, position: { lg: 'sticky' }, top: { lg: 88 }, bgcolor: 'surface.muted', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
            <VisibilityOutlinedIcon fontSize="small" color="primary" />
            <Typography variant="subtitle2" component="h2">
              Live preview
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              A4 · prints client &amp; office copy
            </Typography>
          </Box>
          <DraftPreview control={control} challanNo={nextNumber.data ?? ''} />
        </Card>
      </Box>

      <ClientFormDialog
        open={clientDialogOpen}
        client={null}
        onClose={() => setClientDialogOpen(false)}
        onSaved={(created) => setValue('client', { _id: created._id, name: created.name }, { shouldValidate: true, shouldDirty: true })}
      />

      <UnsavedChangesDialog when={isDirty && !saveMutation.isPending} title="Discard this challan?" />

      <Dialog open={Boolean(savedChallan)} onClose={closeSavedDialog} maxWidth="xs" fullWidth aria-labelledby="saved-title">
        {savedChallan && (
          <>
            <DialogCloseButton onClose={closeSavedDialog} />
            <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
              <CheckCircleRoundedIcon color="success" sx={{ fontSize: 56 }} />
              <Typography id="saved-title" variant="h6" sx={{ mt: 1 }}>
                Challan saved
              </Typography>
              <Typography sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '0.04em', mt: 0.5 }}>{savedChallan.challanNo}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {savedChallan.clientName} · {formatCurrency(savedChallan.totalAmount)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={actions.isBusy(savedChallan, 'print') ? <CircularProgress size={16} /> : <PrintOutlinedIcon />}
                  onClick={() => actions.print(savedChallan)}
                >
                  Print
                </Button>
                <Button
                  variant="contained"
                  startIcon={actions.isBusy(savedChallan, 'pdf') ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdfOutlinedIcon />}
                  onClick={() => actions.downloadPdf(savedChallan)}
                >
                  Download PDF
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeSavedDialog}>Create another</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
