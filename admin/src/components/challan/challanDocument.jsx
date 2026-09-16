import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import challanCss from '../../styles/challan.css?raw';
import { ChallanCopy, ChallanPrintSheet } from './ChallanTemplate';
import { safeFileName } from '../../utils/format';

const A4 = { width: 210, height: 297 };

export const challanFileBase = (challan) =>
  safeFileName(`${challan.clientName || challan.client?.name || 'Client'} (${challan.challanNo})`);

const PRINT_HOST_ID = 'ch-print-host';
const PRINT_STYLE_ID = 'ch-print-style';

// Only the print host is visible when printing; it stays hidden on screen.
const PRINT_CSS = `
#${PRINT_HOST_ID} { display: none; }
@media print {
  @page { size: A4 portrait; margin: 0; }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    background: #fff !important;
  }
  body > *:not(#${PRINT_HOST_ID}) { display: none !important; }
  #${PRINT_HOST_ID} { display: block !important; }
}`;

let activePrint = null;

function ensurePrintStyle() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = PRINT_CSS;
  document.head.appendChild(style);
}

/** Renders a React element to static HTML (avoids loading react-dom/server). */
function renderMarkup(element) {
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    flushSync(() => root.render(element));
    return container.innerHTML;
  } finally {
    root.unmount();
  }
}

/** Resolves once every <img> inside root has loaded (or failed), so captures aren't blank. */
function waitForImages(root) {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }),
    ),
  );
}

// JPEG is faster to encode and smaller than PNG here.
const JPEG_QUALITY = 0.92;
const toJpeg = (canvas) => canvas.toDataURL('image/jpeg', JPEG_QUALITY);

/**
 * Prints both copies on A4 from the main document, with print CSS hiding the app UI.
 * iOS WebKit prints the parent page for iframe.print(), so an iframe cannot be used.
 */
export async function printChallan({ challan, watermarkUrl }) {
  activePrint?.();
  ensurePrintStyle();

  const host = document.createElement('div');
  host.id = PRINT_HOST_ID;
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = renderMarkup(<ChallanPrintSheet challan={challan} watermarkUrl={watermarkUrl} />);
  document.body.appendChild(host);

  const previousTitle = document.title;
  document.title = challanFileBase(challan); // Used as the default "Save as PDF" file name.

  let fallbackTimer;
  const cleanup = () => {
    if (activePrint !== cleanup) return;
    activePrint = null;
    clearTimeout(fallbackTimer);
    window.removeEventListener('afterprint', onAfterPrint);
    host.remove();
    document.title = previousTitle;
  };
  // iOS can fire afterprint before the print sheet has captured the page, so wait a moment.
  const onAfterPrint = () => setTimeout(cleanup, 1000);
  activePrint = cleanup;
  window.addEventListener('afterprint', onAfterPrint);
  // Fallback for browsers that never fire afterprint (host is hidden on screen anyway).
  fallbackTimer = setTimeout(cleanup, 5 * 60_000);

  try {
    await document.fonts?.ready;
  } catch {
    /* fonts API unavailable */
  }
  // The watermark is fetched over the network; printing early would drop it.
  await waitForImages(host);

  window.print();
}

/** Copies Inter @font-face rules, with absolute font URLs, for use in an isolated document. */
function collectFontFaceCss() {
  const rules = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const base = sheet.href || document.baseURI;
      for (const rule of Array.from(sheet.cssRules)) {
        if (!(rule instanceof CSSFontFaceRule) || !rule.cssText.includes('Inter')) continue;
        rules.push(
          rule.cssText.replace(/url\((['"]?)([^'")]+)\1\)/g, (match, _q, src) =>
            /^(data|blob):/.test(src) ? match : `url("${new URL(src, base).href}")`,
          ),
        );
      }
    } catch {
      // Cross-origin stylesheet: cannot be read, skip it.
    }
  }
  return rules.join('\n');
}

// A4 width in CSS px (96dpi). The PDF is always laid out at this width, whatever the device.
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

/**
 * Renders the challan inside a hidden iframe with its own inlined CSS and a fixed A4 viewport,
 * so phones (narrow viewport, font boosting, stylesheet re-fetch in html2canvas's clone) render
 * exactly like desktop.
 */
async function renderIsolatedChallan(challan, watermarkUrl) {
  const markup = renderMarkup(
    <div className="ch-root">
      <ChallanCopy challan={challan} variant="full" watermarkUrl={watermarkUrl} />
    </div>,
  );

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  // Kept renderable (not display:none / visibility:hidden) so layout and fonts resolve.
  iframe.style.cssText = `position:fixed;left:-20000px;top:0;width:${A4_WIDTH_PX}px;height:${A4_HEIGHT_PX}px;border:0;opacity:0;pointer-events:none;`;
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=${A4_WIDTH_PX}, initial-scale=1">
<style>${collectFontFaceCss()}
${challanCss}
html, body { margin: 0; padding: 0; width: ${A4_WIDTH_PX}px; background: #fff;
  -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
</style></head><body>${markup}</body></html>`);
  doc.close();

  try {
    // Make sure every Inter weight used by the challan is loaded before capturing.
    await Promise.all(
      ['400', '600', '700', '800'].map((w) => doc.fonts?.load(`${w} 16px "Inter Variable"`, '₹0Aa')),
    );
    await doc.fonts?.ready;
  } catch {
    /* fonts API unavailable: system fallback font is used */
  }
  await waitForImages(doc);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  return { iframe, element: doc.body.firstElementChild };
}

const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

/**
 * Hands the PDF to the user the same way on Android, iOS and desktop.
 * iOS home-screen apps cannot download blob links, so they use the share sheet ("Save to Files").
 */
async function deliverPdf(blob, fileName) {
  if (isIOS() && isStandalone()) {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: fileName });
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return; // User closed the share sheet.
        // Share not allowed (e.g. activation expired): fall through to a normal download.
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke late: mobile browsers read the blob asynchronously after the click.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Downloads one challan copy as "Client Name (Challan Number).pdf". */
export async function downloadChallanPdf({ challan, siteName, watermarkUrl }) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);

  const { iframe, element } = await renderIsolatedChallan(challan, watermarkUrl);

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      width: A4_WIDTH_PX,
      height: element.scrollHeight,
      windowWidth: A4_WIDTH_PX,
      windowHeight: Math.max(A4_HEIGHT_PX, element.scrollHeight),
      scrollX: 0,
      scrollY: 0,
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    const title = challanFileBase(challan);
    pdf.setProperties({ title, subject: 'Delivery Challan', creator: siteName });

    const pageHeightPx = Math.floor((canvas.width * A4.height) / A4.width);

    if (canvas.height <= pageHeightPx + 2) {
      pdf.addImage(toJpeg(canvas), 'JPEG', 0, 0, A4.width, (canvas.height * A4.width) / canvas.width);
    } else {
      // Very long challans: slice the render into consecutive A4 pages.
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      const ctx = slice.getContext('2d');
      for (let offset = 0, pageIndex = 0; offset < canvas.height; offset += pageHeightPx, pageIndex += 1) {
        const h = Math.min(pageHeightPx, canvas.height - offset);
        slice.height = h;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, slice.width, h);
        ctx.drawImage(canvas, 0, offset, canvas.width, h, 0, 0, canvas.width, h);
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(toJpeg(slice), 'JPEG', 0, 0, A4.width, (h * A4.width) / canvas.width);
      }
    }

    await deliverPdf(pdf.output('blob'), `${title}.pdf`);
  } finally {
    iframe.remove();
  }
}
