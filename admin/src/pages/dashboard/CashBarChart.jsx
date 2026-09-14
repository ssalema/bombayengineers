import { useState } from 'react';
import {
  Box, Card, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography, useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import TableRowsRoundedIcon from '@mui/icons-material/TableRowsRounded';
import { radius } from '../../theme/theme';
import { formatCompactCurrency, formatCurrency, formatNumber } from '../../utils/format';

/** Amount bar chart with a table toggle. points = [{ label, amount, count }] */
export function CashBarChart({ title, subtitle, points, loading, action, height = 300 }) {
  const [view, setView] = useState('chart');
  const { palette, typography } = useTheme();
  const tickLabelStyle = { fontSize: typography.caption.fontSize, fill: palette.text.secondary };

  return (
    <Card sx={{ p: { xs: 2, sm: 2.5 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" component="h2">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {loading ? <Skeleton width={180} /> : subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {action}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, v) => v && setView(v)}
            aria-label={`${title} view`}
            sx={{ '& .MuiToggleButton-root': { px: 1, height: 38 } }}
          >
            <ToggleButton value="chart" aria-label="Chart view">
              <BarChartRoundedIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table view">
              <TableRowsRoundedIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {loading ? (
        <Skeleton variant="rounded" height={height} />
      ) : view === 'chart' ? (
        <Box sx={{ flexGrow: 1, minHeight: height }}>
          <BarChart
            height={height}
            series={[
              {
                data: points.map((p) => p.amount),
                label: 'Amount',
                color: palette.chart.bar,
                valueFormatter: (v, { dataIndex }) =>
                  `${formatCurrency(v)} · ${formatNumber(points[dataIndex]?.count)} challan${points[dataIndex]?.count === 1 ? '' : 's'}`,
              },
            ]}
            xAxis={[
              {
                scaleType: 'band',
                data: points.map((p) => p.label),
                // Keep bars slim when there are few categories.
                categoryGapRatio: points.length <= 3 ? 0.75 : 0.45,
                disableTicks: true,
                tickLabelStyle,
              },
            ]}
            yAxis={[
              {
                valueFormatter: (v) => formatCompactCurrency(v),
                width: 64,
                disableLine: true,
                disableTicks: true,
                tickLabelStyle,
              },
            ]}
            grid={{ horizontal: true }}
            borderRadius={4}
            hideLegend
            margin={{ top: 10, right: 8, bottom: 0, left: 0 }}
            sx={{
              '& .MuiChartsGrid-line': { stroke: palette.chart.grid, strokeDasharray: '4 4' },
              '& .MuiChartsAxis-line': { stroke: palette.divider },
            }}
          />
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: height, border: 1, borderColor: 'divider', borderRadius: radius.md }}>
          <Table size="small" stickyHeader aria-label={`${title} data`}>
            <TableHead>
              <TableRow>
                <TableCell>Period</TableCell>
                <TableCell align="right">Challans</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {points.map((p) => (
                <TableRow key={p.label}>
                  <TableCell>{p.label}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatNumber(p.count)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(p.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}
