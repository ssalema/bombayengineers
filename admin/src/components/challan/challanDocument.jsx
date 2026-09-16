import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import challanCss from '../../styles/challan.css?raw';
import { ChallanCopy, ChallanPrintSheet } from './ChallanTemplate';
import { safeFileName } from '../../utils/format';
import { DEFAULT_LANGUAGE, resolveLanguage } from '../../i18n/languages';

const A4 = { width: 210, height: 297 };

// Weights the challan uses, and a sample string that forces the Gujarati unicode-range subset.
const FONT_WEIGHTS = ['400', '600', '700', '800'];
const GUJARATI_FAMILY = 'Noto Sans Gujarati Variable';
const GUJARATI_SAMPLE = 'ડિલિવરી ચલણ';

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
 * Chromium (desktop Chrome/Edge, Android Chrome, Samsung Internet) honours `@page { margin: 0 }` and
 * drops its URL/date header and footer, so the HTML sheet prints as exactly one A4 page.
 * WebKit (every iOS browser, Safari) and Firefox add their own margins and footer, which no CSS can
 * remove, pushing the sheet onto a second page. `userAgentData` only exists in Chromium; iOS Chrome
 * is WebKit underneath, hence the explicit iOS check.
 */
const printsHtmlExactly = () => !isIOS() && Boolean(navigator.userAgentData);

/**
 * Prints both copies (client + office) on A4, one sheet per page, on every browser.
 *
 * Returns a function when the print file is ready but the browser needs a fresh tap to open it
 * (iOS share sheet after the user gesture expired); call it from a click handler.
 */
export async function printChallan(options) {
  if (printsHtmlExactly()) {
    await printHtmlSheet(options);
    return null;
  }
  const { challan } = options;
  const blob = await buildPrintSheetPdf(options);
  return printPdf(blob, `${challanFileBase(challan)}.pdf`);
}

/**
 * Prints both copies on A4 from the main document, with print CSS hiding the app UI.
 * iOS WebKit prints the parent page for iframe.print(), so an iframe cannot be used.
 */
async function printHtmlSheet({
  challan,
  watermarkUrl,
  clientLanguage = DEFAULT_LANGUAGE,
  officeLanguage = DEFAULT_LANGUAGE,
}) {
  activePrint?.();
  ensurePrintStyle();

  const host = document.createElement('div');
  host.id = PRINT_HOST_ID;
  host.setAttribute('aria-hidden', 'true');
  host.innerHTML = renderMarkup(
    <ChallanPrintSheet
      challan={challan}
      watermarkUrl={watermarkUrl}
      clientLanguage={clientLanguage}
      officeLanguage={officeLanguage}
    />,
  );
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
    // The Gujarati face is only fetched once Gujarati text is laid out, so wait for it explicitly
    // rather than letting the print sheet go out in a fallback font.
    if ([clientLanguage, officeLanguage].some((l) => resolveLanguage(l) === 'gu')) {
      await Promise.all(
        FONT_WEIGHTS.map((w) => document.fonts?.load(`${w} 16px "${GUJARATI_FAMILY}"`, GUJARATI_SAMPLE)),
      );
    }
    await document.fonts?.ready;
  } catch {
    /* fonts API unavailable */
  }
  // The watermark is fetched over the network; printing early would drop it.
  await waitForImages(host);

  window.print();
}

// Families the challan renders with: Inter for Latin, Noto Sans Gujarati for Gujarati script.
const DOCUMENT_FONT_FAMILIES = ['Inter', 'Noto Sans Gujarati'];
const FONT_FAMILY_PATTERN = new RegExp(DOCUMENT_FONT_FAMILIES.join('|'));

/** Copies the challan's @font-face rules, with absolute font URLs, for use in an isolated document. */
function collectFontFaceCss() {
  const rules = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const base = sheet.href || document.baseURI;
      for (const rule of Array.from(sheet.cssRules)) {
        if (!(rule instanceof CSSFontFaceRule) || !FONT_FAMILY_PATTERN.test(rule.cssText)) continue;
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
 * Renders challan markup inside a hidden iframe with its own inlined CSS and a fixed A4 viewport,
 * so phones (narrow viewport, font boosting, stylesheet re-fetch in html2canvas's clone) render
 * exactly like desktop. `languages` lists the copy languages, so their fonts are loaded first.
 */
async function renderIsolated(element, languages) {
  const markup = renderMarkup(element);

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
    // Make sure every weight used by the challan is loaded before capturing. html2canvas rasterises
    // whatever is laid out at that moment, so an unloaded Gujarati face would fall back to a
    // system font (or render as boxes) in the PDF.
    const faces = [['Inter Variable', '₹0Aa']];
    if (languages.some((l) => resolveLanguage(l) === 'gu')) faces.push([GUJARATI_FAMILY, GUJARATI_SAMPLE]);
    await Promise.all(
      faces.flatMap(([family, sample]) => FONT_WEIGHTS.map((w) => doc.fonts?.load(`${w} 16px "${family}"`, sample))),
    );
    await doc.fonts?.ready;
  } catch {
    /* fonts API unavailable: system fallback font is used */
  }
  await waitForImages(doc);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  return { iframe, root: doc.body.firstElementChild };
}

/**
 * Rasterises `element` at A4 width and adds it to the PDF, starting on a new page unless `firstPage`.
 * Anything taller than A4 is sliced into consecutive pages.
 */
async function addElementPages(pdf, html2canvas, element, { scale, firstPage }) {
  const canvas = await html2canvas(element, {
    scale,
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

  const pageHeightPx = Math.floor((canvas.width * A4.height) / A4.width);

  if (canvas.height <= pageHeightPx + scale) {
    if (!firstPage) pdf.addPage();
    // Rounding can leave the render a pixel taller than A4; clamp so it never spills.
    pdf.addImage(toJpeg(canvas), 'JPEG', 0, 0, A4.width, Math.min(A4.height, (canvas.height * A4.width) / canvas.width));
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
      if (pageIndex > 0 || !firstPage) pdf.addPage();
      pdf.addImage(toJpeg(slice), 'JPEG', 0, 0, A4.width, (h * A4.width) / canvas.width);
    }
    slice.width = 0;
  }
  // Free the bitmap straight away: iOS caps total canvas memory.
  canvas.width = 0;
  canvas.height = 0;
}

const loadPdfLibs = () =>
  Promise.all([import('html2canvas-pro'), import('jspdf')]).then(([h2c, jspdf]) => ({
    html2canvas: h2c.default,
    jsPDF: jspdf.jsPDF,
  }));

const newA4Pdf = (jsPDF) => new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

/** Builds the two-copy print sheet as an exact A4 PDF, one `.ch-page` per PDF page. */
async function buildPrintSheetPdf({
  challan,
  watermarkUrl,
  clientLanguage = DEFAULT_LANGUAGE,
  officeLanguage = DEFAULT_LANGUAGE,
}) {
  const { html2canvas, jsPDF } = await loadPdfLibs();
  const { iframe, root } = await renderIsolated(
    <ChallanPrintSheet
      challan={challan}
      watermarkUrl={watermarkUrl}
      clientLanguage={clientLanguage}
      officeLanguage={officeLanguage}
    />,
    [clientLanguage, officeLanguage],
  );

  try {
    const pdf = newA4Pdf(jsPDF);
    pdf.setProperties({ title: challanFileBase(challan), subject: 'Delivery Challan' });
    const pages = Array.from(root.querySelectorAll('.ch-page'));
    for (const [index, page] of pages.entries()) {
      // Higher than the download's scale: this copy goes to paper.
      await addElementPages(pdf, html2canvas, page, { scale: 3, firstPage: index === 0 });
    }
    return pdf.output('blob');
  } finally {
    iframe.remove();
  }
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

  downloadBlob(blob, fileName);
}

function downloadBlob(blob, fileName) {
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

/** Opens the iOS share sheet (which has "Print"). Resolves false if a fresh user tap is needed. */
async function sharePdfFile(file) {
  try {
    await navigator.share({ files: [file], title: file.name });
    return true;
  } catch (error) {
    if (error?.name === 'AbortError') return true; // User closed the share sheet.
    if (error?.name === 'NotAllowedError') return false; // The tap that started this has expired.
    throw error;
  }
}

/** Prints a PDF blob through the browser's PDF viewer in a hidden iframe (desktop Firefox / Safari). */
function printPdfInFrame(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    frame.onload = () => {
      // Give the PDF viewer a moment to initialise before asking it to print.
      setTimeout(() => {
        try {
          frame.contentWindow.focus();
          frame.contentWindow.print();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 300);
    };
    frame.src = url;
    document.body.appendChild(frame);
    // The print dialog may stay open a while; remove the frame well after it closes.
    setTimeout(() => {
      frame.remove();
      URL.revokeObjectURL(url);
    }, 5 * 60_000);
  });
}

/**
 * Sends the print-sheet PDF to the platform's PDF printing, which never adds the browser's
 * URL/date footer and always scales the A4 page to fit the paper.
 * Returns a retry function if a fresh tap is needed to open the share sheet.
 */
async function printPdf(blob, fileName) {
  if (isIOS()) {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      if (await sharePdfFile(file)) return null;
      return () => sharePdfFile(file);
    }
    // Older iOS without file sharing: the downloaded PDF opens in Quick Look, which can print.
    downloadBlob(blob, fileName);
    return null;
  }

  try {
    await printPdfInFrame(blob);
  } catch {
    // The browser would not print the embedded PDF: hand over the file to print from its viewer.
    downloadBlob(blob, fileName);
  }
  return null;
}

/** Downloads one challan copy as "Client Name (Challan Number).pdf". */
export async function downloadChallanPdf({ challan, siteName, watermarkUrl, language = DEFAULT_LANGUAGE }) {
  const { html2canvas, jsPDF } = await loadPdfLibs();

  const { iframe, root } = await renderIsolated(
    <div className="ch-root">
      <ChallanCopy challan={challan} variant="full" watermarkUrl={watermarkUrl} language={language} />
    </div>,
    [language],
  );

  try {
    const pdf = newA4Pdf(jsPDF);
    const title = challanFileBase(challan);
    pdf.setProperties({ title, subject: 'Delivery Challan', creator: siteName });
    await addElementPages(pdf, html2canvas, root, { scale: 2, firstPage: true });
    await deliverPdf(pdf.output('blob'), `${title}.pdf`);
  } finally {
    iframe.remove();
  }
}
