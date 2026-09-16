import { useRef } from 'react';
import { useSnackbar } from 'notistack';
import { Box, Card, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { radius } from '../../theme/theme';
import { prepareImageUpload } from '../../utils/image';

const MAX_SIZE = 2 * 1024 * 1024;
/** Larger picks (e.g. phone photos) are downscaled to this before upload. */
const MAX_DIMENSION = { logo: 1200, favicon: 512 };
const ACCEPT = {
  logo: ['image/png', 'image/jpeg', 'image/webp'],
  favicon: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/webp'],
};

const COPY = {
  logo: {
    title: 'Logo',
    hint: 'Transparent PNG, around 400×120px',
  },
  favicon: {
    title: 'Favicon',
    hint: 'Square PNG, 64×64px or larger. Also used as the challan watermark.',
  },
};

/** `pending`: null | { file, preview } | 'remove'. The parent saves staged changes. */
function AssetField({ asset, currentUrl, pending, disabled, onPick, onRemove }) {
  const inputRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();
  const copy = COPY[asset];

  const handleFile = async (event) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    const file = await prepareImageUpload(picked, { maxBytes: MAX_SIZE, maxDimension: MAX_DIMENSION[asset] });
    if (!ACCEPT[asset].includes(file.type)) {
      enqueueSnackbar('Unsupported file type', { variant: 'warning' });
      return;
    }
    if (file.size > MAX_SIZE) {
      enqueueSnackbar('File must be 2 MB or smaller', { variant: 'warning' });
      return;
    }
    onPick(asset, file);
  };

  const customSrc = pending === 'remove' ? null : pending?.preview || currentUrl;
  const openPicker = () => !disabled && inputRef.current?.click();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: asset === 'favicon' ? 1 : 'none' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 1 }}>
        <Typography variant="subtitle2" component="h3">
          {copy.title}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
          {copy.hint}
        </Typography>
      </Box>

      <input ref={inputRef} type="file" hidden accept={ACCEPT[asset].join(',')} onChange={handleFile} />
      <Box
        onClick={openPicker}
        sx={{
          position: 'relative',
          // The favicon box absorbs leftover height so this card matches the General card.
          ...(asset === 'favicon' ? { flex: 1, minHeight: { xs: 150, md: 110 } } : { height: 120 }),
          borderRadius: radius.md,
          border: '1px solid',
          borderColor: 'divider',
          cursor: disabled ? 'default' : 'pointer',
          transition: 'border-color .15s',
          '&:hover, &:focus-within': { borderColor: 'primary.main' },
          '&:hover .asset-actions, &:focus-within .asset-actions': { opacity: 1, transform: 'translate(-50%, 0)' },
          // Touch screens have no hover, so keep the actions visible there.
          '@media (hover: none)': { '& .asset-actions': { opacity: 1, transform: 'translate(-50%, 0)' } },
        }}
      >
        {customSrc ? (
          <Box
            component="img"
            src={customSrc}
            alt={`${copy.title} preview`}
            sx={{ position: 'absolute', inset: 16, width: 'calc(100% - 32px)', height: 'calc(100% - 32px)', objectFit: 'contain', opacity: disabled ? 0.5 : 1 }}
          />
        ) : (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: 'text.secondary', pb: 3 }}>
            <ImageOutlinedIcon />
            <Typography variant="caption">No {copy.title.toLowerCase()} uploaded</Typography>
          </Box>
        )}
        <Box
          className="asset-actions"
          onClick={(e) => e.stopPropagation()}
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            display: 'flex',
            gap: 0.25,
            p: 0.25,
            borderRadius: radius.pill,
            bgcolor: 'overlay.toolbar',
            opacity: 0,
            transform: 'translate(-50%, 4px)',
            transition: 'opacity .15s, transform .15s',
          }}
        >
          <Tooltip title={customSrc ? 'Replace' : 'Upload'}>
            <span>
              <IconButton
                size="small"
                aria-label={`${customSrc ? 'Replace' : 'Upload'} ${copy.title.toLowerCase()}`}
                disabled={disabled}
                onClick={openPicker}
                sx={{ color: 'common.white' }}
              >
                <SwapHorizRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {customSrc && (
            <Tooltip title="Remove">
              <span>
                <IconButton
                  size="small"
                  aria-label={`Remove ${copy.title.toLowerCase()}`}
                  disabled={disabled}
                  onClick={() => onRemove(asset)}
                  sx={{ color: 'error.light' }}
                >
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export function BrandingSettings({ settings, pending, disabled, onPick, onRemove }) {
  return (
    <Card sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography variant="subtitle1" component="h2">
          Branding
        </Typography>
        <Tooltip title="Used in the sidebar, login page and the browser tab. PNG, JPG, ICO or WEBP · max 2 MB.">
          <InfoOutlinedIcon fontSize="small" color="action" />
        </Tooltip>
      </Box>
      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {['logo', 'favicon'].map((asset) => (
          <AssetField
            key={asset}
            asset={asset}
            currentUrl={settings[asset]?.url}
            pending={pending[asset]}
            disabled={disabled}
            onPick={onPick}
            onRemove={onRemove}
          />
        ))}
      </Box>
    </Card>
  );
}
