import { createTheme, alpha } from '@mui/material/styles';

/** Sampled from the logo (docs/logo.png): mark + wordmark #205B75, tagline #231F20. Tints/shades keep the logo hue (198°). */
export const brand = {
  main: '#205B75',
  dark: '#164254',
  light: '#4A809A',
  lighter: '#E8F1F5',
  ink: '#231F20',
  charcoal: '#231F20',
};

/** Radius scale. Use these strings in `sx`; bare numbers are multiplied by shape.borderRadius. */
export const radius = {
  sm: '6px', // chips, small badges
  md: '8px', // buttons, inputs, icon buttons, inner boxes
  lg: '10px', // nav items, icon badges, segmented controls
  xl: '14px', // cards, paper
  xxl: '16px', // dialogs
  pill: '999px',
  round: '50%',
};

/** Shadows used outside MUI's elevation scale. */
export const shadow = {
  floating: '0 8px 24px rgba(15, 23, 42, 0.12)',
  page: '0 1px 3px rgba(22, 66, 84, 0.08), 0 8px 24px rgba(22, 66, 84, 0.08)',
};

/** Full-screen min height. `100vh` includes the collapsible browser toolbar on phones; `100dvh` is the visible height. */
export const fullViewportHeight = { minHeight: '100vh', '@supports (min-height: 100dvh)': { minHeight: '100dvh' } };

const fontFamily = '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// Weights in use: 400 regular, 500 medium, 600 semibold, 700 bold.
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: brand.main, dark: brand.dark, light: brand.light, contrastText: '#FFFFFF' },
    secondary: { main: brand.charcoal, contrastText: '#FFFFFF' },
    success: { main: '#1E8E5A' },
    warning: { main: '#C77C0E' },
    error: { main: '#C8372D' },
    info: { main: '#2F74C0' },
    background: { default: '#F3F7F9', paper: '#FFFFFF' },
    text: { primary: brand.ink, secondary: '#5B6A72' },
    divider: '#E1E9ED',
    /** Neutral fills (logo hue, low saturation): subtle (table heads), muted (read-only fields), strong (selected hover). */
    surface: { subtle: '#F6FAFB', muted: '#EDF3F5', strong: '#E4ECEF' },
    /** Chart bar colour (logo colour). */
    chart: { bar: brand.main, grid: '#E8EEF1' },
    overlay: { scrim: alpha(brand.ink, 0.5), toolbar: alpha(brand.ink, 0.85) },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily,
    h3: { fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15 },
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      fontSize: '1.625rem',
      '@media (min-width:600px)': { fontSize: '1.875rem' },
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
      fontSize: '1.375rem',
      '@media (min-width:600px)': { fontSize: '1.625rem' },
    },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
    overline: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', lineHeight: 1.5 },
    /** KPI headline figure; shrinks at lg. */
    kpi: {
      fontSize: '1.375rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.25,
      fontVariantNumeric: 'tabular-nums',
      '@media (min-width:600px)': { fontSize: '1.5rem' },
      '@media (min-width:1200px)': { fontSize: '1.3125rem' },
      '@media (min-width:1536px)': { fontSize: '1.5625rem' },
    },
    /** Oversized status numerals (e.g. 404). */
    display: { fontSize: '4.5rem', fontWeight: 700, lineHeight: 1 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: 'antialiased' },
        '::selection': { backgroundColor: alpha(brand.main, 0.18) },
      },
    },
    MuiTypography: {
      defaultProps: { variantMapping: { kpi: 'p', display: 'p' } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radius.md, paddingInline: 16 },
        sizeSmall: { paddingInline: 12 },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: radius.md } },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: radius.xl } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme: t }) => ({ border: `1px solid ${t.palette.divider}`, borderRadius: radius.xl }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: radius.md,
          backgroundColor: t.palette.background.paper,
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha(brand.main, 0.5) },
        }),
        notchedOutline: ({ theme: t }) => ({ borderColor: t.palette.divider }),
      },
    },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiSelect: { defaultProps: { size: 'small' } },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme: t }) => ({ borderBottom: `1px solid ${t.palette.divider}`, paddingBlock: 12 }),
        head: ({ theme: t }) => ({
          ...t.typography.overline,
          textTransform: 'uppercase',
          color: t.palette.text.secondary,
          backgroundColor: t.palette.surface.subtle,
          whiteSpace: 'nowrap',
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': { borderBottom: 0 },
          '&.MuiTableRow-hover:hover': { backgroundColor: alpha(brand.main, 0.035) },
        },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: radius.xxl } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 700, fontSize: 18 } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { paddingInline: 24, paddingBottom: 20 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: radius.sm } },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: { tooltip: { fontSize: 12, backgroundColor: brand.ink }, arrow: { color: brand.ink } },
    },
    MuiListItemButton: {
      styleOverrides: { root: { borderRadius: radius.lg } },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
    },
  },
});
