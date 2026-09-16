import { useLayoutEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { shadow } from '../../theme/theme';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { ChallanCopy } from './ChallanTemplate';

const A4_WIDTH_PX = (210 / 25.4) * 96; // 210mm at 96 dpi

/** Renders the real A4 challan template scaled down to fit its container. */
export function ScaledChallanPreview({ challan }) {
  const { faviconUrl } = useSiteSettings();
  const containerRef = useRef(null);
  const pageRef = useRef(null);
  const [scale, setScale] = useState(0.6);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const page = pageRef.current;
    if (!container || !page) return undefined;

    const measure = () => {
      const nextScale = Math.min(1, container.clientWidth / A4_WIDTH_PX);
      setScale(nextScale);
      setHeight(page.offsetHeight * nextScale);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  return (
    <Box ref={containerRef} sx={{ width: '100%', height, overflow: 'hidden', position: 'relative' }}>
      <Box
        ref={pageRef}
        className="ch-root"
        sx={{
          width: '210mm',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          boxShadow: shadow.page,
        }}
      >
        <ChallanCopy challan={challan} variant="preview" watermarkUrl={faviconUrl} />
      </Box>
    </Box>
  );
}
