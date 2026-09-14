import { memo } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import {
  Autocomplete, Box, Button, IconButton, TextField, Tooltip, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { formatCurrency, roundMoney } from '../../utils/format';
import { radius } from '../../theme/theme';

export const emptyItem = () => ({ description: '', qty: '1', rate: '' });

/** Keeps only digits and a single decimal point (max 2 decimals for money, 3 for qty). */
const sanitizeNumber = (value, decimals) => {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [int = '', ...rest] = cleaned.split('.');
  if (rest.length === 0) return int.slice(0, 9);
  return `${int.slice(0, 9)}.${rest.join('').slice(0, decimals)}`;
};

// Wide layout (table-like row) when the editor itself has room; stacked cards when narrow.
const WIDE = '@container items (min-width: 640px)';

const rowGrid = {
  display: 'grid',
  gap: 1.25,
  alignItems: 'start',
  gridTemplateColumns: '1fr 1fr',
  gridTemplateAreas: '"remove remove" "desc desc" "qty rate" "amount amount"',
  [WIDE]: {
    gridTemplateColumns: 'minmax(0, 1fr) 90px 120px 130px 40px',
    gridTemplateAreas: '"desc qty rate amount remove"',
  },
};

function NumberCell({ area, label, name, control, decimals, ariaLabel, placeholder }) {
  return (
    <Box sx={{ gridArea: area }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600, [WIDE]: { display: 'none' } }}>
        {label}
      </Typography>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            placeholder={placeholder}
            onChange={(e) => field.onChange(sanitizeNumber(e.target.value, decimals))}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message}
            slotProps={{ htmlInput: { inputMode: 'decimal', 'aria-label': ariaLabel, style: { textAlign: 'right' } } }}
          />
        )}
      />
    </Box>
  );
}

const ItemRow = memo(function ItemRow({ index, control, descriptionOptions, canRemove, onRemove }) {
  const qty = useWatch({ control, name: `items.${index}.qty` });
  const rate = useWatch({ control, name: `items.${index}.rate` });
  const amount = roundMoney((Number(qty) || 0) * (Number(rate) || 0));

  return (
    <Box
      sx={{
        ...rowGrid,
        p: 1.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: radius.md,
        bgcolor: 'background.paper',
        [WIDE]: { ...rowGrid[WIDE], p: 0, px: 1, py: 1, border: 0, borderBottom: 1, borderColor: 'divider', borderRadius: 0 },
      }}
    >
      <Box sx={{ gridArea: 'desc', minWidth: 0 }}>
        <Controller
          name={`items.${index}.description`}
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete
              freeSolo
              options={descriptionOptions.map((d) => d.name)}
              inputValue={field.value}
              onInputChange={(_, value, reason) => {
                if (reason !== 'reset') field.onChange(value);
              }}
              onChange={(_, value) => field.onChange(value ?? '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={field.ref}
                  onBlur={field.onBlur}
                  placeholder="Select or type a description"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  slotProps={{
                    ...params.slotProps,
                    htmlInput: { ...params.slotProps.htmlInput, maxLength: 300, 'aria-label': `Item ${index + 1} description` },
                  }}
                />
              )}
            />
          )}
        />
      </Box>

      <NumberCell area="qty" label="Qty" name={`items.${index}.qty`} control={control} decimals={3} ariaLabel={`Item ${index + 1} quantity`} />
      <NumberCell area="rate" label="Rate" name={`items.${index}.rate`} control={control} decimals={2} ariaLabel={`Item ${index + 1} rate`} placeholder="0.00" />

      <Box
        sx={{
          gridArea: 'amount',
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.5,
          borderRadius: radius.md,
          bgcolor: 'surface.muted',
          fontVariantNumeric: 'tabular-nums',
          [WIDE]: { justifyContent: 'flex-end' },
        }}
        aria-label={`Item ${index + 1} amount`}
      >
        <Typography variant="body2" color="text.secondary" sx={{ [WIDE]: { display: 'none' } }}>
          Amount
        </Typography>
        <Typography sx={{ fontWeight: 600 }}>{formatCurrency(amount)}</Typography>
      </Box>

      <Box sx={{ gridArea: 'remove', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', height: 40 }}>
        <Tooltip title={canRemove ? 'Remove row' : 'At least one item is required'}>
          <span>
            <IconButton size="small" color="error" onClick={() => onRemove(index)} disabled={!canRemove} aria-label={`Remove item ${index + 1}`}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
});

export function ChallanItemsEditor({ control, descriptionOptions, arrayError }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <Box sx={{ containerType: 'inline-size', containerName: 'items' }}>
      <Box
        aria-hidden="true"
        sx={{
          display: 'none',
          [WIDE]: {
            ...rowGrid[WIDE],
            display: 'grid',
            px: 1,
            py: 1,
            bgcolor: 'surface.subtle',
            borderRadius: radius.md,
            typography: 'overline',
            textTransform: 'uppercase',
            color: 'text.secondary',
          },
        }}
      >
        <span>Description</span>
        <span style={{ textAlign: 'right' }}>Qty</span>
        <span style={{ textAlign: 'right' }}>Rate</span>
        <span style={{ textAlign: 'right', paddingRight: 12 }}>Amount</span>
        <span />
      </Box>

      <Box sx={{ display: 'grid', gap: 1.25, [WIDE]: { gap: 0 } }}>
        {fields.map((field, index) => (
          <ItemRow
            key={field.id}
            index={index}
            control={control}
            descriptionOptions={descriptionOptions}
            canRemove={fields.length > 1}
            onRemove={remove}
          />
        ))}
      </Box>

      {arrayError && (
        <Typography color="error" variant="body2" sx={{ mt: 1 }}>
          {arrayError}
        </Typography>
      )}

      <Button
        startIcon={<AddRoundedIcon />}
        variant="outlined"
        onClick={() => append(emptyItem(), { shouldFocus: true, focusName: `items.${fields.length}.description` })}
        disabled={fields.length >= 100}
        sx={{ mt: 2, borderStyle: 'dashed' }}
      >
        Add row
      </Button>
    </Box>
  );
}
