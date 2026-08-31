import type { Location } from 'react-router-dom';

export const DEFAULT_AUTH_DESTINATION = '/diary';

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_AUTH_DESTINATION;
  }

  if (value.includes('\\')) return DEFAULT_AUTH_DESTINATION;

  try {
    const base = new URL(window.location.origin);
    const destination = new URL(value, base);
    if (destination.origin !== base.origin) return DEFAULT_AUTH_DESTINATION;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return DEFAULT_AUTH_DESTINATION;
  }
}

export function getRequestedPath(location: Location): string {
  return `${location.pathname}${location.search}${location.hash}`;
}

export function createAuthURL(returnTo: string): string {
  const params = new URLSearchParams({ returnTo });
  return `/auth?${params.toString()}`;
}

export function getAuthDestination(search: string): string {
  return sanitizeReturnTo(new URLSearchParams(search).get('returnTo'));
}

export function getGoogleCallbackURLs(returnTo: string) {
  const destination = sanitizeReturnTo(returnTo);
  const callbackURL = new URL(destination, window.location.origin).toString();
  const errorURL = new URL('/auth', window.location.origin);
  errorURL.searchParams.set('returnTo', destination);
  errorURL.searchParams.set('error', 'oauth');

  return { callbackURL, errorCallbackURL: errorURL.toString() };
}
