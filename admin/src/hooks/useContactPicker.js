import { useCallback, useMemo, useState } from 'react';

/**
 * Contact Picker API support. Shipped only on Chrome/Edge for Android, and only in a
 * secure, top-level context — everywhere else the number is typed by hand instead.
 * Checked lazily rather than at module load so nothing is captured before the
 * document settles (and so this module stays free of import-time side effects).
 */
const isSupported = () =>
  typeof window !== 'undefined' &&
  typeof navigator !== 'undefined' &&
  'contacts' in navigator &&
  'ContactsManager' in window &&
  typeof navigator.contacts?.select === 'function';

/**
 * Why the picker is unavailable, phrased for the user. `null` when it is available.
 * Ordered so the most fixable cause wins: a phone on `http://<lan-ip>` has no
 * `navigator.contacts` at all, and "not supported" would be misleading there —
 * the real fix is HTTPS.
 */
const unavailableReason = () => {
  if (typeof window === 'undefined') return 'Phonebook access is not available here.';
  if (isSupported()) return null;
  if (!window.isSecureContext) return 'Phonebook access needs a secure (https) connection. Enter the number manually.';
  if (window.top !== window.self) return 'Phonebook access is blocked inside an embedded frame. Enter the number manually.';
  return 'Phonebook access is not supported in this browser — it works in Chrome on Android. Enter the number manually.';
};

/** Cancelling the picker is a normal outcome, not an error worth reporting. */
const isCancelled = (error) => error?.name === 'AbortError' || error?.name === 'NotAllowedError';

/**
 * One `{ name, tel }` entry per distinct phone number across the picked contacts, so a
 * contact with several numbers can be narrowed down too. A contact without any number
 * still yields one entry with `tel: ''`, so the caller can say why nothing was filled.
 */
const toCandidates = (contacts) => {
  const seen = new Set();
  return contacts.flatMap((contact) => {
    const name = contact.name?.find(Boolean)?.trim() ?? '';
    const tels = (contact.tel ?? []).map((t) => t?.trim()).filter(Boolean);
    if (!tels.length) return [{ name, tel: '' }];
    return tels
      .filter((tel) => {
        const key = `${name}|${tel.replace(/\D/g, '').slice(-10)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((tel) => ({ name, tel }));
  });
};

/**
 * Opens the device phonebook and returns the picked numbers as `[{ name, tel }]`
 * (either may be ''), or `null` when the picker is unavailable, cancelled or fails.
 * Usually one entry, but callers must let the user choose when there are more:
 * Chrome's Android picker ignores `multiple: false` once its search box is used, and
 * a single contact may carry several numbers.
 * `onUnavailable(reason)` fires when the device can't open a phonebook at all;
 * `onError(message)` fires only for failures after a supported picker was opened.
 */
export function useContactPicker({ onError, onUnavailable } = {}) {
  const [picking, setPicking] = useState(false);
  const supported = useMemo(() => isSupported(), []);

  const pickContacts = useCallback(async () => {
    if (!isSupported()) {
      onUnavailable?.(unavailableReason());
      return null;
    }
    if (picking) return null;

    setPicking(true);
    try {
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      const candidates = toCandidates(contacts ?? []);
      return candidates.length ? candidates : null;
    } catch (error) {
      if (!isCancelled(error)) onError?.('Could not open contacts. Enter the number manually.');
      return null;
    } finally {
      setPicking(false);
    }
  }, [onError, onUnavailable, picking]);

  return { pickContacts, picking, isSupported: supported };
}
