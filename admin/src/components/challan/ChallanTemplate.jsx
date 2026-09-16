import { amountInWords } from '../../utils/amountInWords';
import { formatAmount, formatChallanDate, formatNumber, formatPhone, roundMoney } from '../../utils/format';
import { HALF_PAGE_ITEM_LIMIT } from '../../config/constants';

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
 */
export function ChallanCopy({ challan, copyLabel, variant = 'full', watermarkUrl = '' }) {
  const data = normalizeChallan(challan);
  const minRows =
    variant === 'half' ? HALF_PAGE_ITEM_LIMIT - noteRowCount(data.notes) : variant === 'full' ? FULL_PAGE_MIN_ROWS : 5;
  const fillerCount = Math.max(0, minRows - data.items.length);

  return (
    <div className={`ch-copy ch-copy--${variant}`}>
      <div className="ch-title-row">
        <span className="ch-title">DELIVERY CHALLAN</span>
        {copyLabel && <span className="ch-copy-label">{copyLabel}</span>}
      </div>

      <div className="ch-meta">
        <div className="ch-meta-item">
          <span className="ch-label">Challan No:</span>
          <span className="ch-value">{data.challanNo || 'NA'}</span>
        </div>
        <div className="ch-meta-item">
          <span className="ch-label">Date:</span>
          <span className="ch-value">{formatChallanDate(data.date) || 'NA'}</span>
        </div>
      </div>

      <div className="ch-ms">
        <span className="ch-label">M/S</span>
        <span className="ch-ms-name">{data.clientName}</span>
        <span className="ch-ms-contact">
          <span className="ch-label">Contact:</span>
          <span className="ch-value">{data.clientContact || 'NA'}</span>
        </span>
      </div>

      <div className="ch-table-wrap">
        <div className="ch-table-box">
          {watermarkUrl && <img className="ch-watermark" src={watermarkUrl} alt="" aria-hidden="true" />}
          <table className="ch-table">
            <thead>
              <tr>
                <th className="ch-col-sr">Sr No</th>
                <th style={{ textAlign: 'left' }}>Description</th>
                <th className="ch-col-qty">Qty</th>
                <th className="ch-col-rate">Rate</th>
                <th className="ch-col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <tr key={idx}>
                  <td className="ch-col-sr">{idx + 1}</td>
                  <td className="ch-desc">{item.description}</td>
                  <td className="ch-col-qty ch-num">{item.qty ? formatNumber(item.qty) : ''}</td>
                  <td className="ch-col-rate ch-num">{item.description || item.rate ? formatAmount(item.rate) : ''}</td>
                  <td className="ch-col-amount ch-num">{item.description || item.amount ? formatAmount(item.amount) : ''}</td>
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
                  Total Amount
                </td>
                <td className="ch-col-amount ch-num">₹ {formatAmount(data.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="ch-words">
          <span className="ch-label">Amount in Words:</span>
          <span className="ch-words-value">{amountInWords(data.totalAmount)}</span>
        </div>

        {data.notes.length > 0 && (
          <div className="ch-note">
            <span className="ch-label">Note:</span>
            <div className="ch-note-list">
              {data.notes.map((note, idx) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={idx} className="ch-note-item">
                  <span className="ch-note-no">{idx + 1}.</span>
                  <span className="ch-note-text">{note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="ch-sign">
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

/**
 * Printable A4 sheet(s) with client and office copies.
 * Short challans fit both on one page; longer ones print a page each.
 */
export function ChallanPrintSheet({ challan, watermarkUrl = '' }) {
  const fitsHalfPage = (challan.items?.length ?? 0) + noteRowCount(challan.notes) <= HALF_PAGE_ITEM_LIMIT;

  if (fitsHalfPage) {
    return (
      <div className="ch-root">
        <div className="ch-page">
          <ChallanCopy challan={challan} variant="half" copyLabel="Client Copy" watermarkUrl={watermarkUrl} />
          <div className="ch-cut">
            <span>✂ Cut here</span>
          </div>
          <ChallanCopy challan={challan} variant="half" copyLabel="Office Copy" watermarkUrl={watermarkUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="ch-root">
      <div className="ch-page" style={{ height: 'auto', minHeight: '297mm' }}>
        <ChallanCopy challan={challan} variant="full" copyLabel="Client Copy" watermarkUrl={watermarkUrl} />
      </div>
      <div className="ch-page" style={{ height: 'auto', minHeight: '297mm' }}>
        <ChallanCopy challan={challan} variant="full" copyLabel="Office Copy" watermarkUrl={watermarkUrl} />
      </div>
    </div>
  );
}
