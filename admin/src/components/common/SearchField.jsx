import { useEffect, useRef, useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useDebounce } from '../../hooks/useDebounce';

/** Debounced search input. Emits `onSearch` after the user stops typing. */
export function SearchField({ value = '', onSearch, placeholder = 'Search…', sx }) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, 350);
  // Last value sent or received, so our own search echo doesn't overwrite the input.
  const synced = useRef(value);

  useEffect(() => {
    // Only external changes (back/forward, reset) replace what is typed.
    if (value !== synced.current) {
      synced.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    const next = debounced.trim();
    if (next !== synced.current) {
      synced.current = next;
      onSearch(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <TextField
      value={text}
      onChange={(e) => setText(e.target.value)}
      placeholder={placeholder}
      sx={{ maxWidth: { sm: 340 }, ...sx }}
      slotProps={{
        htmlInput: { 'aria-label': placeholder, maxLength: 100 },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </InputAdornment>
          ),
          endAdornment: text ? (
            <InputAdornment position="end">
              <IconButton size="small" aria-label="Clear search" onClick={() => setText('')} edge="end">
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />
  );
}
