import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import challanCss from '../../styles/challan.css?raw';
import { ChallanCopy, ChallanPrintSheet } from './ChallanTemplate';
import { safeFileName } from '../../utils/format';

const A4 = { width: 210, height: 297 };

export const challanFileBase = (challan) =>
  safeFileName(`${challan.clientName || challan.client?.name || 'Client'} (${challan.challanNo})`);

/** Copies Inter @font-face rules into the print iframe. */
function collectFontFaceCss() {
  const rules = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSFontFaceRule && rule.cssText.includes('Inter')) rules.push(rule.cssText);
      }
    } catch {
      // Cross-origin stylesheet: cannot be read, skip it.
    }
  }
  return rules.join('\n');
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

// JPEG is faster to encode and smaller than PNG here.
const JPEG_QUALITY = 0.92;
const toJpeg = (canvas) => canvas.toDataURL('image/jpeg', JPEG_QUALITY);

/** Prints both copies on A4 through a hidden iframe, keeping the app UI out of the printout. */
export async function printChallan({ challan }) {
  const markup = renderMarkup(<ChallanPrintSheet challan={challan} />);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${challanFileBase(challan).replace(/</g, '&lt;')}</title>
<style>${collectFontFaceCss()}\n${challanCss}
@page { size: A4 portrait; margin: 0; }
html, body { margin: 0; padding: 0; background: #fff; }
</style></head><body>${markup}</body></html>`);
  doc.close();

  try {
    await doc.fonts?.ready;
  } catch {
    /* fonts API unavailable */
  }

  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
  // Fallback for browsers that never fire afterprint.
  setTimeout(() => iframe.isConnected && iframe.remove(), 60_000);

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
}

/** Downloads one challan copy as "Client Name (Challan Number).pdf". */
export async function downloadChallanPdf({ challan, siteName }) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;left:-12000px;top:0;width:210mm;background:#fff;pointer-events:none;';
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    flushSync(() => {
      root.render(
        <div className="ch-root">
          <ChallanCopy challan={challan} variant="full" />
        </div>,
      );
    });

    await document.fonts?.ready;

    const canvas = await html2canvas(host.firstElementChild, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
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

    pdf.save(`${title}.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
}
