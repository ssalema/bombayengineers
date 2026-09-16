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
 * Opens the device phonebook and returns the chosen contact as `{ name, tel }`
 * (either may be ''), or `null` when the picker is unavailable, cancelled or fails.
 * `onUnavailable(reason)` fires when the device can't open a phonebook at all;
 * `onError(message)` fires only for failures after a supported picker was opened.
 */
export function useContactPicker({ onError, onUnavailable } = {}) {
  const [picking, setPicking] = useState(false);
  const supported = useMemo(() => isSupported(), []);

  const pickContact = useCallback(async () => {
    if (!isSupported()) {
      onUnavailable?.(unavailableReason());
      return null;
    }
    if (picking) return null;

    setPicking(true);
    try {
      const [contact] = await navigator.contacts.select(['name', 'tel'], { multiple: false });
      if (!contact) return null;
      return {
        name: contact.name?.find(Boolean)?.trim() ?? '',
        tel: contact.tel?.find(Boolean)?.trim() ?? '',
      };
    } catch (error) {
      if (!isCancelled(error)) onError?.('Could not open contacts. Enter the number manually.');
      return null;
    } finally {
      setPicking(false);
    }
  }, [onError, onUnavailable, picking]);

  return { pickContact, picking, isSupported: supported };
}
