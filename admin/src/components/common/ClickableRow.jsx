import { TableRow } from '@mui/material';

/** Table row opened by click or Enter/Space. Keys pressed on inner buttons are ignored. */
export function ClickableRow({ onOpen, label, children, sx }) {
  return (
    <TableRow
      hover
      tabIndex={0}
      aria-label={label}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      sx={{
        cursor: 'pointer',
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
        ...sx,
      }}
    >
      {children}
    </TableRow>
  );
}
