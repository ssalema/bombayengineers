import { resolveLanguage } from '../i18n/languages';

/* ---------------------------------------------------------------- English */

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

const EN = {
  rupees: 'Rupees',
  and: 'and',
  paise: 'Paise',
  only: 'Only',
  toWords: integerToWords,
  subHundred: belowHundred,
};

/* --------------------------------------------------------------- Gujarati */

// Gujarati has a distinct word for every number below 100, so they are listed in full.
const GU_BELOW_HUNDRED = [
  '', 'એક', 'બે', 'ત્રણ', 'ચાર', 'પાંચ', 'છ', 'સાત', 'આઠ', 'નવ',
  'દસ', 'અગિયાર', 'બાર', 'તેર', 'ચૌદ', 'પંદર', 'સોળ', 'સત્તર', 'અઢાર', 'ઓગણીસ',
  'વીસ', 'એકવીસ', 'બાવીસ', 'ત્રેવીસ', 'ચોવીસ', 'પચ્ચીસ', 'છવ્વીસ', 'સત્તાવીસ', 'અઠ્ઠાવીસ', 'ઓગણત્રીસ',
  'ત્રીસ', 'એકત્રીસ', 'બત્રીસ', 'તેત્રીસ', 'ચોત્રીસ', 'પાંત્રીસ', 'છત્રીસ', 'સાડત્રીસ', 'આડત્રીસ', 'ઓગણચાળીસ',
  'ચાળીસ', 'એકતાળીસ', 'બેતાળીસ', 'ત્રેતાળીસ', 'ચુંમાળીસ', 'પિસ્તાળીસ', 'છેતાળીસ', 'સુડતાળીસ', 'અડતાળીસ', 'ઓગણપચાસ',
  'પચાસ', 'એકાવન', 'બાવન', 'ત્રેપન', 'ચોપન', 'પંચાવન', 'છપ્પન', 'સત્તાવન', 'અઠ્ઠાવન', 'ઓગણસાઠ',
  'સાઠ', 'એકસઠ', 'બાસઠ', 'ત્રેસઠ', 'ચોસઠ', 'પાંસઠ', 'છાસઠ', 'સડસઠ', 'અડસઠ', 'ઓગણસિત્તેર',
  'સિત્તેર', 'એકોતેર', 'બોતેર', 'તોતેર', 'ચુમોતેર', 'પંચોતેર', 'છોતેર', 'સિત્યોતેર', 'ઇઠ્યોતેર', 'ઓગણએંસી',
  'એંસી', 'એક્યાસી', 'બ્યાસી', 'ત્યાસી', 'ચોર્યાસી', 'પંચાસી', 'છ્યાસી', 'સત્યાસી', 'અઠ્યાસી', 'ઓગણનેવું',
  'નેવું', 'એકાણું', 'બાણું', 'ત્રાણું', 'ચોરાણું', 'પંચાણું', 'છન્નું', 'સત્તાણું', 'અઠ્ઠાણું', 'નવ્વાણું',
];
const GU_HUNDREDS = ['', 'સો', 'બસો', 'ત્રણસો', 'ચારસો', 'પાંચસો', 'છસો', 'સાતસો', 'આઠસો', 'નવસો'];

const guBelowHundred = (n) => GU_BELOW_HUNDRED[n];

function guBelowThousand(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return [GU_HUNDREDS[hundred], rest ? guBelowHundred(rest) : ''].filter(Boolean).join(' ');
}

/** Same Indian grouping as the English version (હજાર, લાખ, કરોડ). */
function guIntegerToWords(num) {
  if (num === 0) return 'શૂન્ય';
  const parts = [];
  const crore = Math.floor(num / 10_000_000);
  const lakh = Math.floor((num % 10_000_000) / 100_000);
  const thousand = Math.floor((num % 100_000) / 1000);
  const rest = num % 1000;

  if (crore) parts.push(`${guIntegerToWords(crore)} કરોડ`);
  if (lakh) parts.push(`${guBelowHundred(lakh)} લાખ`);
  if (thousand) parts.push(`${guBelowHundred(thousand)} હજાર`);
  if (rest) parts.push(guBelowThousand(rest));
  return parts.join(' ');
}

const GU = {
  rupees: 'રૂપિયા',
  and: 'અને',
  paise: 'પૈસા',
  only: 'પૂરા',
  toWords: guIntegerToWords,
  subHundred: guBelowHundred,
};

/* ------------------------------------------------------------------ Public */

const LOCALES = { en: EN, gu: GU };

/**
 * Amount spelled out in the given challan language.
 * e.g. 2501.41 -> "Rupees Two Thousand Five Hundred One and Forty One Paise Only"
 *      31440   -> "રૂપિયા એકત્રીસ હજાર ચારસો ચાળીસ પૂરા"
 */
export function amountInWords(amount, language) {
  const locale = LOCALES[resolveLanguage(language)];
  const value = Math.max(0, Math.round((Number(amount) || 0) * 100));
  const rupees = Math.floor(value / 100);
  const paise = value % 100;

  let words = `${locale.rupees} ${locale.toWords(rupees)}`;
  if (paise) words += ` ${locale.and} ${locale.subHundred(paise)} ${locale.paise}`;
  return `${words} ${locale.only}`;
}
