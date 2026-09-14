import { Box, IconButton, MenuItem, Select, Tooltip, Typography } from '@mui/material';
import FirstPageRoundedIcon from '@mui/icons-material/FirstPageRounded';
import LastPageRoundedIcon from '@mui/icons-material/LastPageRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { brand } from '../../theme/theme';
import { ROWS_PER_PAGE_OPTIONS } from '../../config/constants';

const circleButton = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: 1,
  borderColor: 'divider',
  color: 'text.secondary',
  bgcolor: 'background.paper',
  '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'background.paper' },
  '&.Mui-disabled': { color: 'action.disabled', borderColor: 'divider', opacity: 0.7 },
};

function NavButton({ label, disabled, onClick, children }) {
  return (
    <Tooltip title={label} disableInteractive>
      <span>
        <IconButton aria-label={label} disabled={disabled} onClick={onClick} size="small" sx={circleButton}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

/** Footer pagination: rows per page and range on the left, page controls on the right. */
export function PaginationBar({ page, limit, total, onPageChange, onLimitChange, disabled = false }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: { xs: 2, sm: 2.5 },
        py: 1.5,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="body2" color="text.secondary" component="label" htmlFor="rows-per-page">
          Rows per page:
        </Typography>
        <Select
          id="rows-per-page"
          value={limit}
          disabled={disabled}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          sx={{ minWidth: 80, height: 38, '& .MuiSelect-select': { py: 0.75 } }}
        >
          {ROWS_PER_PAGE_OPTIONS.map((n) => (
            <MenuItem key={n} value={n}>
              {n}
            </MenuItem>
          ))}
        </Select>
        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {start}–{end} of{' '}
          <Box component="strong" sx={{ color: 'text.primary' }}>
            {total}
          </Box>
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5, whiteSpace: 'nowrap' }}>
          Page{' '}
          <Box component="strong" sx={{ color: 'text.primary' }}>
            {page}
          </Box>{' '}
          of{' '}
          <Box component="strong" sx={{ color: 'text.primary' }}>
            {totalPages}
          </Box>
        </Typography>
        <NavButton label="First page" disabled={disabled || isFirst} onClick={() => onPageChange(1)}>
          <FirstPageRoundedIcon fontSize="small" />
        </NavButton>
        <NavButton label="Previous page" disabled={disabled || isFirst} onClick={() => onPageChange(page - 1)}>
          <ChevronLeftRoundedIcon fontSize="small" />
        </NavButton>
        <Box
          aria-current="page"
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: brand.dark,
            color: '#fff',
            typography: 'body2',
            fontWeight: 700,
          }}
        >
          {page}
        </Box>
        <NavButton label="Next page" disabled={disabled || isLast} onClick={() => onPageChange(page + 1)}>
          <ChevronRightRoundedIcon fontSize="small" />
        </NavButton>
        <NavButton label="Last page" disabled={disabled || isLast} onClick={() => onPageChange(totalPages)}>
          <LastPageRoundedIcon fontSize="small" />
        </NavButton>
      </Box>
    </Box>
  );
}
