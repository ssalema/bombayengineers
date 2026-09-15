import { amountInWords } from '../../utils/amountInWords';
import { formatAmount, formatChallanDate, formatNumber, roundMoney } from '../../utils/format';
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
    items,
    totalAmount: roundMoney(items.reduce((sum, i) => sum + i.amount, 0)),
  };
}

/** One challan copy. variant: "half" (2-up print) | "full" (A4 page) | "preview" (natural height). */
export function ChallanCopy({ challan, copyLabel, variant = 'full' }) {
  const data = normalizeChallan(challan);
  const minRows = variant === 'half' ? HALF_PAGE_ITEM_LIMIT : variant === 'full' ? FULL_PAGE_MIN_ROWS : 5;
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
      </div>

      <div className="ch-table-wrap">
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

        <div className="ch-words">
          <span className="ch-label">Amount in Words:</span>
          <span className="ch-words-value">{amountInWords(data.totalAmount)}</span>
        </div>
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
export function ChallanPrintSheet({ challan }) {
  const fitsHalfPage = (challan.items?.length ?? 0) <= HALF_PAGE_ITEM_LIMIT;

  if (fitsHalfPage) {
    return (
      <div className="ch-root">
        <div className="ch-page">
          <ChallanCopy challan={challan} variant="half" copyLabel="Client Copy" />
          <div className="ch-cut">
            <span>✂ Cut here</span>
          </div>
          <ChallanCopy challan={challan} variant="half" copyLabel="Office Copy" />
        </div>
      </div>
    );
  }

  return (
    <div className="ch-root">
      <div className="ch-page" style={{ height: 'auto', minHeight: '297mm' }}>
        <ChallanCopy challan={challan} variant="full" copyLabel="Client Copy" />
      </div>
      <div className="ch-page" style={{ height: 'auto', minHeight: '297mm' }}>
        <ChallanCopy challan={challan} variant="full" copyLabel="Office Copy" />
      </div>
    </div>
  );
}
