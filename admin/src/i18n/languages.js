/**
 * Languages a challan can be printed / downloaded in.
 * `label` is the option shown in the picker (in its own script), `caption` the line under it and
 * `name` the English name used in messages. Only the challan document is translated — the admin UI
 * stays in English.
 */
export const DEFAULT_LANGUAGE = 'en';

export const CHALLAN_LANGUAGES = [
  { code: 'en', name: 'English', label: 'English', caption: 'Standard English challan' },
  { code: 'gu', name: 'Gujarati', label: 'ગુજરાતી', caption: 'Gujarati labels, same figures' },
];

export const SUPPORTED_LANGUAGES = CHALLAN_LANGUAGES.map((l) => l.code);

/** Falls back to English for anything unknown, so callers can pass a stored value straight in. */
export const resolveLanguage = (code) => (SUPPORTED_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE);

/** Languages written with their own numerals. English keeps Latin digits. */
const NUMERALS = { gu: '૦૧૨૩૪૫૬૭૮૯' };

/**
 * Rewrites Latin digits into the language's own numerals, leaving grouping separators, the currency
 * symbol and any Latin text untouched — the same output as Intl's `-u-nu-gujr` numbering system.
 * Applied to values (quantities, rates, amounts, dates), never to identifiers such as the challan
 * number or a contact number, which have to stay dialable and searchable.
 */
export const localizeDigits = (value, language) => {
  const numerals = NUMERALS[resolveLanguage(language)];
  const text = String(value ?? '');
  return numerals ? text.replace(/[0-9]/g, (digit) => numerals[digit]) : text;
};

/** English name of a language, for snackbars and other admin-UI copy. */
export const languageName = (code) => CHALLAN_LANGUAGES.find((l) => l.code === resolveLanguage(code))?.name ?? '';

/**
 * Printing produces two copies, so the choice is a pair: the client's copy language, then the
 * office's. The office copy stays English in both options — it is the one kept on file.
 */
export const PRINT_LANGUAGE_PAIRS = [
  {
    id: 'en-en',
    client: 'en',
    office: 'en',
    label: 'English – English',
    caption: 'Client copy and office copy in English',
  },
  {
    id: 'gu-en',
    client: 'gu',
    office: 'en',
    label: 'ગુજરાતી – English',
    caption: 'Client copy in Gujarati, office copy in English',
  },
];

/** Options for the language picker: a pair per print option, one language per PDF option. */
export const languageOptions = (kind) =>
  kind === 'print'
    ? PRINT_LANGUAGE_PAIRS
    : CHALLAN_LANGUAGES.map((l) => ({ id: l.code, client: l.code, office: l.code, label: l.label, caption: l.caption }));
