import { Controller, useFieldArray } from 'react-hook-form';
import { Box, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

export const NOTE_MAX_LENGTH = 200;
export const NOTES_MAX_COUNT = 10;

export const emptyNote = () => ({ text: '' });

export function ChallanNotesEditor({ control }) {
  const { fields, append, remove, update } = useFieldArray({ control, name: 'notes' });

  return (
    <Box>
      <Box sx={{ display: 'grid', gap: 1.25 }}>
        {fields.map((field, index) => (
          <Box key={field.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Typography sx={{ minWidth: 24, height: 40, display: 'flex', alignItems: 'center', fontWeight: 600, color: 'text.secondary' }}>
              {index + 1}.
            </Typography>
            <Controller
              name={`notes.${index}.text`}
              control={control}
              render={({ field: input, fieldState }) => (
                <TextField
                  {...input}
                  inputRef={input.ref}
                  fullWidth
                  placeholder="Type a note"
                  error={Boolean(fieldState.error)}
                  helperText={fieldState.error?.message}
                  slotProps={{ htmlInput: { maxLength: NOTE_MAX_LENGTH, 'aria-label': `Note ${index + 1}` } }}
                />
              )}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', height: 40 }}>
              <Tooltip title={fields.length > 1 ? 'Remove row' : 'Clear note'}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => (fields.length > 1 ? remove(index) : update(0, emptyNote()))}
                  aria-label={`Remove note ${index + 1}`}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ))}
      </Box>

      <Button
        startIcon={<AddRoundedIcon />}
        variant="outlined"
        onClick={() => append(emptyNote(), { shouldFocus: true, focusName: `notes.${fields.length}.text` })}
        disabled={fields.length >= NOTES_MAX_COUNT}
        sx={{ mt: 2, borderStyle: 'dashed' }}
      >
        Add row
      </Button>
    </Box>
  );
}
