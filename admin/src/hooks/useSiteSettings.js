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

/** Public site settings (name, logo, favicon, etc.). */
export function useSiteSettings() {
  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsApi.public().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
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

// Static defaults from index.html / public/. Used until settings load and when a
// setting is blank, so the browser (tab, shortcuts, installed app) never sees an empty icon or name.
const DEFAULT_APP_NAME = 'Bombay Engineers — Admin';
const DEFAULT_DESCRIPTION = 'Bombay Engineers — Cash Challan Management Panel';
const DEFAULT_ICON = '/favicon.png';

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

/** Syncs tab title, favicon and meta tags with settings. Mounted once in App. */
export function useDocumentBranding() {
  const { settings, siteName, logoUrl, faviconUrl } = useSiteSettings();
  const { tagline } = settings;

  useEffect(() => {
    const appName = siteName ? `${siteName} — Admin` : DEFAULT_APP_NAME;
    const description = tagline || DEFAULT_DESCRIPTION;
    document.title = appName;
    setMeta('meta[name="application-name"]', 'name', 'application-name', appName);
    setMeta('meta[name="apple-mobile-web-app-title"]', 'name', 'apple-mobile-web-app-title', appName);
    setMeta('meta[property="og:title"]', 'property', 'og:title', appName);
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:image"]', 'property', 'og:image', logoUrl || DEFAULT_ICON);
  }, [siteName, tagline, logoUrl]);

  useEffect(() => {
    const icon = faviconUrl || DEFAULT_ICON;
    setHeadLink('app-favicon', 'icon', icon);
    setHeadLink('app-touch-icon', 'apple-touch-icon', icon);
  }, [faviconUrl]);
}
