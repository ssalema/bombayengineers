const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function belowHundred(n) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`;
}

function belowThousand(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return [hundred ? `${ONES[hundred]} Hundred` : '', rest ? belowHundred(rest) : ''].filter(Boolean).join(' ');
}

/** Converts an integer to words using the Indian numbering system (Thousand, Lakh, Crore). */
function integerToWords(num) {
  if (num === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(num / 10_000_000);
  const lakh = Math.floor((num % 10_000_000) / 100_000);
  const thousand = Math.floor((num % 100_000) / 1000);
  const rest = num % 1000;

  if (crore) parts.push(`${integerToWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(' ');
}

/** e.g. 2501.41 -> "Rupees Two Thousand Five Hundred One and Forty One Paise Only" */
export function amountInWords(amount) {
  const value = Math.max(0, Math.round((Number(amount) || 0) * 100));
  const rupees = Math.floor(value / 100);
  const paise = value % 100;

  let words = `Rupees ${integerToWords(rupees)}`;
  if (paise) words += ` and ${belowHundred(paise)} Paise`;
  return `${words} Only`;
}
