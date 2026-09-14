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

const setHeadLink = (id, rel, href) => {
  let link = document.getElementById(id);
  if (!href) {
    link?.remove();
    return;
  }
  if (!link) {
    link = document.createElement('link');
    link.id = id;
    link.rel = rel;
    document.head.appendChild(link);
  }
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
    document.title = siteName;
    setMeta('meta[name="application-name"]', 'name', 'application-name', siteName);
    setMeta('meta[property="og:title"]', 'property', 'og:title', siteName);
    setMeta('meta[name="description"]', 'name', 'description', tagline);
    setMeta('meta[property="og:description"]', 'property', 'og:description', tagline);
    setMeta('meta[property="og:image"]', 'property', 'og:image', logoUrl);
  }, [siteName, tagline, logoUrl]);

  useEffect(() => {
    // "data:," stops the browser requesting /favicon.ico.
    setHeadLink('app-favicon', 'icon', faviconUrl || 'data:,');
    setHeadLink('app-touch-icon', 'apple-touch-icon', faviconUrl);
  }, [faviconUrl]);
}
