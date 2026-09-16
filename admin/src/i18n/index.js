import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import gu from './locales/gu.json';
import { DEFAULT_LANGUAGE, resolveLanguage, SUPPORTED_LANGUAGES } from './languages';

/** Namespace holding every string printed on the challan document. */
export const CHALLAN_NS = 'challan';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: { en, gu },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: CHALLAN_NS,
    ns: [CHALLAN_NS],
    interpolation: { escapeValue: false }, // React escapes already.
    react: { useSuspense: false },
  });
}

/**
 * Translator for one challan copy.
 * Used instead of `useTranslation` because the template is also rendered outside the React
 * provider tree (print host and the PDF iframe), and each copy fixes its own language.
 */
export const getChallanT = (language) => i18n.getFixedT(resolveLanguage(language), CHALLAN_NS);

/** Slug used to look a stored item description up in a locale's `descriptions` glossary. */
export const descriptionKey = (text = '') =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Item descriptions are free text typed by the user, so they are translated through the locale's
 * `descriptions` glossary rather than a fixed key. Anything without an entry — a new or one-off
 * description — prints exactly as it was entered, so a challan is never blocked on a translation.
 * English has no glossary on purpose: an English challan always shows the stored wording verbatim.
 */
export const translateDescription = (t, text = '') => {
  const key = descriptionKey(text);
  return key ? t(`descriptions.${key}`, { defaultValue: text }) : text;
};

export default i18n;
