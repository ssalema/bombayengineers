import { Box, Skeleton, Typography } from '@mui/material';
import { useSiteSettings } from '../../hooks/useSiteSettings';

/** Logo from settings; falls back to the site name as text, or nothing if neither is set. */
export function BrandLogo({ height, sx }) {
  const { siteName, logoUrl, isLoading } = useSiteSettings();

  if (isLoading) {
    return <Skeleton variant="rounded" width={height * 4} height={height} sx={{ maxWidth: '100%', ...sx }} />;
  }
  if (logoUrl) {
    return <Box component="img" src={logoUrl} alt={siteName} sx={{ maxHeight: height, maxWidth: '100%', objectFit: 'contain', display: 'block', ...sx }} />;
  }
  if (!siteName) return null;
  return (
    <Typography component="span" sx={{ fontWeight: 700, fontSize: height * 0.5, lineHeight: 1.2, color: 'text.primary', textAlign: 'center', ...sx }}>
      {siteName}
    </Typography>
  );
}
