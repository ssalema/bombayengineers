import { Box, Button, Skeleton, TableCell, TableRow, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import { radius } from '../../theme/theme';

export function TableSkeletonRows({ rows = 5, columns }) {
  return Array.from({ length: rows }, (_, r) => (
    <TableRow key={`sk-${r}`}>
      {Array.from({ length: columns }, (__, c) => (
        <TableCell key={c}>
          <Skeleton width={c === 0 ? '60%' : '80%'} height={22} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

/** Empty / no-results message. Show `action` only when nothing exists yet, not for empty searches. */
export function EmptyState({ title = 'Nothing here yet', description, action, icon: Icon = InboxRoundedIcon, tone = 'primary' }) {
  return (
    <Box sx={{ py: 7, px: 2, textAlign: 'center' }}>
      <Box
        sx={(t) => ({
          width: 64,
          height: 64,
          borderRadius: radius.round,
          bgcolor: alpha(t.palette[tone].main, 0.1),
          color: t.palette[tone].main,
          display: 'grid',
          placeItems: 'center',
          mx: 'auto',
          mb: 2,
        })}
      >
        <Icon />
      </Box>
      <Typography variant="subtitle1">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 380, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Box>
  );
}

export function TableMessageRow({ columns, children }) {
  return (
    <TableRow>
      <TableCell colSpan={columns} sx={{ borderBottom: 0 }}>
        {children}
      </TableCell>
    </TableRow>
  );
}

export function ErrorState({ title = 'Could not load data', message, onRetry }) {
  return (
    <EmptyState
      icon={ErrorOutlineRoundedIcon}
      tone="error"
      title={title}
      description={message}
      action={onRetry && <Button variant="outlined" onClick={onRetry}>Try again</Button>}
    />
  );
}
