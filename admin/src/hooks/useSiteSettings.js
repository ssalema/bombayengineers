import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/services';
import { queryKeys } from '../api/queryKeys';

const EMPTY = {
  siteName: '',
  tagline: '',
  contactNumber: '',
  email: '',
  address: '',
  logo: { url: '' },
  favicon: { url: '' },
};

// Last known branding, so a reload shows the real business name and logo on the first
// paint instead of a placeholder. Refreshed from the server on every load.
const CACHE_KEY = 'site-branding';

const readCache = () => {
  try {
    const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY));
    return cached && typeof cached === 'object' ? cached : undefined;
  } catch {
    return undefined; // Private mode, disabled storage, or corrupt entry.
  }
};

const writeCache = (settings) => {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {
    /* Storage full or unavailable: the cache is an optimisation, not a requirement. */
  }
};

/** Public site settings (name, logo, favicon, etc.). */
export function useSiteSettings() {
  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsApi.public().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    // Render the cached branding while the real settings are in flight.
    placeholderData: readCache,
  });

  const settings = useMemo(() => ({ ...EMPTY, ...(query.data ?? {}) }), [query.data]);
  return {
    ...query,
    settings,
    siteName: settings.siteName || '',
    logoUrl: settings.logo?.url || '',
    faviconUrl: settings.favicon?.url || '',
  };
}

// Icon files in public/. These are the only branding fallbacks left: an icon slot cannot
// be left empty without the browser drawing a broken image, and a manifest with no icon
// is not installable. The business NAME has no fallback anywhere by design — it comes
// from Settings → General or it is not shown at all.
const DEFAULT_ICON = '/favicon.png';
// Square, padded icon: iOS stretches a non-square touch icon on the home screen.
const DEFAULT_TOUCH_ICON = '/apple-icon.png';
// Product suffix on the tab title and the installed app name: "<business name> - CCMS".
// Only ever appended to a real name from Settings — it is never shown on its own.
const APP_NAME_SUFFIX = 'CCMS';
// Matches <meta name="theme-color"> in index.html.
const THEME_COLOR = '#205B75';
const BACKGROUND_COLOR = '#ffffff';
// Installability: Chrome wants a >=192px and a 512px icon, so these stand in whenever
// Branding has no favicon uploaded.
const DEFAULT_MANIFEST_ICONS = [
  { src: '/icon-android-cesi.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icon-android.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
];

const setHeadLink = (id, rel, href) => {
  let link = document.getElementById(id);
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = rel;
    document.head.appendChild(link);
  }
  if (link.getAttribute('href') === href) return;
  // Uploaded favicons may be ico/webp; a stale type="image/png" would make browsers skip them.
  link.removeAttribute('type');
  link.removeAttribute('sizes');
  link.href = href;
};

const setMeta = (selector, attr, key, content) => {
  let meta = document.head.querySelector(selector);
  if (!content) {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

// A blob: manifest has no base URL, so every path inside it must be absolute.
const absolute = (url) => new URL(url, window.location.origin).href;

let manifestUrl = '';

/**
 * Replaces the static manifest with one built from settings, so the installed app's
 * name and icon follow Settings → General instead of a file baked in at build time.
 */
const setManifest = (manifest) => {
  const link = document.getElementById('app-manifest') ?? document.head.querySelector('link[rel="manifest"]');
  if (!link) return;
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  const next = URL.createObjectURL(blob);
  link.href = next;
  // Revoke the previous one only; the browser re-reads the manifest from the new href.
  if (manifestUrl) URL.revokeObjectURL(manifestUrl);
  manifestUrl = next;
};

/** Syncs tab title, favicon, meta tags and web app manifest with settings. Mounted once in App. */
export function useDocumentBranding() {
  const { settings, siteName, logoUrl, faviconUrl, isPlaceholderData } = useSiteSettings();
  const { tagline } = settings;
  const appName = siteName ? `${siteName} - ${APP_NAME_SUFFIX}` : '';

  useEffect(() => {
    if (isPlaceholderData) return; // Don't write the cache back over itself.
    if (settings.siteName) writeCache(settings);
  }, [isPlaceholderData, settings]);

  useEffect(() => {
    // No name in settings means no name shown: better an untitled tab, which the browser
    // fills with the URL, than a stand-in business name that is not the real one.
    document.title = appName;
    setMeta('meta[name="application-name"]', 'name', 'application-name', appName);
    setMeta('meta[name="apple-mobile-web-app-title"]', 'name', 'apple-mobile-web-app-title', appName);
    setMeta('meta[property="og:title"]', 'property', 'og:title', appName);
    setMeta('meta[name="description"]', 'name', 'description', tagline);
    setMeta('meta[property="og:description"]', 'property', 'og:description', tagline);
    setMeta('meta[property="og:image"]', 'property', 'og:image', logoUrl || DEFAULT_ICON);
  }, [appName, tagline, logoUrl]);

  useEffect(() => {
    setHeadLink('app-favicon', 'icon', faviconUrl || DEFAULT_ICON);
    setHeadLink('app-touch-icon', 'apple-touch-icon', faviconUrl || DEFAULT_TOUCH_ICON);
  }, [faviconUrl]);

  useEffect(() => {
    // A manifest with no name would make the install prompt invent one from the URL, so
    // leave the static manifest in place until the real name is known.
    if (!appName) return;
    setManifest({
      name: appName,
      short_name: appName,
      description: tagline || undefined,
      start_url: absolute('/'),
      scope: absolute('/'),
      display: 'standalone',
      theme_color: THEME_COLOR,
      background_color: BACKGROUND_COLOR,
      icons: faviconUrl
        ? // "any" rather than a fixed size: the uploaded favicon's dimensions are not known here.
          [{ src: faviconUrl, sizes: 'any', type: 'image/png', purpose: 'any' }]
        : DEFAULT_MANIFEST_ICONS.map((icon) => ({ ...icon, src: absolute(icon.src) })),
    });
  }, [appName, tagline, faviconUrl]);
}
