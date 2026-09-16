import { amountInWords } from '../../utils/amountInWords';
import { formatAmount, formatChallanDate, formatNumber, formatPhone, roundMoney } from '../../utils/format';
import { HALF_PAGE_ITEM_LIMIT } from '../../config/constants';
import { getChallanT, translateDescription } from '../../i18n';
import { DEFAULT_LANGUAGE, localizeDigits, resolveLanguage } from '../../i18n/languages';

const FULL_PAGE_MIN_ROWS = 14;

/** Normalises a saved or draft challan for rendering, recalculating amounts. */
function normalizeChallan(challan) {
  const items = (challan.items ?? []).map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    return { description: item.description ?? '', qty, rate, amount: roundMoney(qty * rate) };
  });
  return {
    challanNo: challan.challanNo ?? '',
    date: challan.date,
    clientName: challan.clientName ?? challan.client?.name ?? '',
    clientContact: formatPhone(challan.client?.contactNumber),
    items,
    totalAmount: roundMoney(items.reduce((sum, i) => sum + i.amount, 0)),
    notes: cleanNotes(challan.notes),
  };
}

const cleanNotes = (notes) => (notes ?? []).map((n) => (n ?? '').trim()).filter(Boolean);

const NOTE_CHARS_PER_LINE = 90;

/** Roughly how many item rows the notes box takes up on a half-page copy. */
function noteRowCount(notes) {
  const list = cleanNotes(notes);
  if (list.length === 0) return 0;
  const lines = list.reduce((sum, note) => sum + Math.ceil(note.length / NOTE_CHARS_PER_LINE), 0);
  return lines + 1; // +1 for the "Note:" heading and box spacing.
}

/**
 * One challan copy. variant: "half" (2-up print) | "full" (A4 page) | "preview" (natural height).
 * watermarkUrl: branding favicon (Settings → Branding), drawn faintly behind the items table.
 * language: challan document language ("en" | "gu"). Only fixed labels are translated —
 * client details, item descriptions, figures and the signature lines are left as entered.
 */
export function ChallanCopy({ challan, copyKey, variant = 'full', watermarkUrl = '', language = DEFAULT_LANGUAGE }) {
  const lang = resolveLanguage(language);
  const t = getChallanT(lang);
  const n = (value) => localizeDigits(value, lang); // Numerals of the copy's language.
  const data = normalizeChallan(challan);
  const minRows =
    variant === 'half' ? HALF_PAGE_ITEM_LIMIT - noteRowCount(data.notes) : variant === 'full' ? FULL_PAGE_MIN_ROWS : 5;
  const fillerCount = Math.max(0, minRows - data.items.length);

  return (
    <div className={`ch-copy ch-copy--${variant}`} lang={lang}>
      <div className="ch-title-row">
        <span className="ch-title">{t('title')}</span>
        {copyKey && <span className="ch-copy-label">{t(copyKey)}</span>}
      </div>

      <div className="ch-meta">
        <div className="ch-meta-item">
          <span className="ch-label">{t('challanNo')}</span>
          <span className="ch-value">{data.challanNo || t('empty')}</span>
        </div>
        <div className="ch-meta-item">
          <span className="ch-label">{t('date')}</span>
          <span className="ch-value">{n(formatChallanDate(data.date)) || t('empty')}</span>
        </div>
      </div>

      <div className="ch-ms">
        <span className="ch-label">{t('ms')}</span>
        <span className="ch-ms-name">{data.clientName}</span>
        <span className="ch-ms-contact">
          <span className="ch-label">{t('contact')}</span>
          <span className="ch-value">{data.clientContact || t('empty')}</span>
        </span>
      </div>

      <div className="ch-table-wrap">
        <div className="ch-table-box">
          {watermarkUrl && <img className="ch-watermark" src={watermarkUrl} alt="" aria-hidden="true" />}
          <table className="ch-table">
            <thead>
              <tr>
                <th className="ch-col-sr">{t('columns.srNo')}</th>
                <th style={{ textAlign: 'left' }}>{t('columns.description')}</th>
                <th className="ch-col-qty">{t('columns.qty')}</th>
                <th className="ch-col-rate">{t('columns.rate')}</th>
                <th className="ch-col-amount">{t('columns.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={idx}>
                  <td className="ch-col-sr">{n(idx + 1)}</td>
                  <td className="ch-desc">{translateDescription(t, item.description)}</td>
                  <td className="ch-col-qty ch-num">{item.qty ? n(formatNumber(item.qty)) : ''}</td>
                  <td className="ch-col-rate ch-num">{item.description || item.rate ? n(formatAmount(item.rate)) : ''}</td>
                  <td className="ch-col-amount ch-num">
                    {item.description || item.amount ? n(formatAmount(item.amount)) : ''}
                  </td>
                </tr>
              ))}
              {Array.from({ length: fillerCount }, (_, i) => (
                <tr key={`filler-${i}`} aria-hidden="true">
                  <td className="ch-col-sr">&nbsp;</td>
                  <td />
                  <td />
                  <td />
                  <td />
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="ch-total-label">
                  {t('totalAmount')}
                </td>
                <td className="ch-col-amount ch-num">₹ {n(formatAmount(data.totalAmount))}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="ch-words">
          <span className="ch-label">{t('amountInWords')}</span>
          <span className="ch-words-value">{amountInWords(data.totalAmount, lang)}</span>
        </div>

        {data.notes.length > 0 && (
          <div className="ch-note">
            <span className="ch-label">{t('note')}</span>
            <div className="ch-note-list">
              {data.notes.map((note, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={idx} className="ch-note-item">
                  <span className="ch-note-no">{n(idx + 1)}.</span>
                  <span className="ch-note-text">{note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Signature wording stays in English in every language, as it is signed as printed. */}
      <footer className="ch-sign" lang="en">
        <div className="ch-sign-box">
          <div className="ch-sign-line">Receiver&apos;s Signature</div>
        </div>
        <div className="ch-sign-box">
          <div className="ch-sign-line">Signature (By Authorized Person)</div>
        </div>
      </footer>
    </div>
  );
}

/** The cut marker is a workshop instruction, not challan content, so it stays English. */
function CutHere() {
  return (
    <div className="ch-cut">
      <span lang={DEFAULT_LANGUAGE}>
        <span className="ch-cut-mark" aria-hidden="true">
          ✂
        </span>{' '}
        {getChallanT(DEFAULT_LANGUAGE)('cutHere')}
      </span>
    </div>
  );
}

/**
 * Printable A4 sheet(s) with client and office copies.
 * Short challans fit both on one page; longer ones print a page each.
 * The two copies are printed in their own languages — the client's copy in the client's language,
 * the office copy (the one kept on file) normally in English.
 */
export function ChallanPrintSheet({
  challan,
  watermarkUrl = '',
  clientLanguage = DEFAULT_LANGUAGE,
  officeLanguage = DEFAULT_LANGUAGE,
}) {
  const fitsHalfPage = (challan.items?.length ?? 0) + noteRowCount(challan.notes) <= HALF_PAGE_ITEM_LIMIT;
  const clientCopy = { challan, watermarkUrl, language: clientLanguage, copyKey: 'clientCopy' };
  const officeCopy = { challan, watermarkUrl, language: officeLanguage, copyKey: 'officeCopy' };

  if (fitsHalfPage) {
    return (
      <div className="ch-root">
        <div className="ch-page">
          <ChallanCopy {...clientCopy} variant="half" />
          <CutHere />
          <ChallanCopy {...officeCopy} variant="half" />
        </div>
      </div>
    );
  }

  return (
    <div className="ch-root">
      <div className="ch-page" style={{ height: 'auto', minHeight: '297mm' }}>
        <ChallanCopy {...clientCopy} variant="full" />
      </div>
      <div className="ch-page" style={{ height: 'auto', minHeight: '297mm' }}>
        <ChallanCopy {...officeCopy} variant="full" />
      </div>
    </div>
  );
}
