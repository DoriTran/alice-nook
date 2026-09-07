import type { LinkPreviewMetadata } from '@/store/diary/type';

const cache = new Map<string, LinkPreviewMetadata>();
const inFlight = new Map<string, Promise<LinkPreviewMetadata>>();
const API_BASE_URL = import.meta.env.VITE_API_URL.replace(/\/$/, '');

export const resolveLinkPreview = (
  normalizedUrl: string,
): Promise<LinkPreviewMetadata> => {
  const cached = cache.get(normalizedUrl);
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(normalizedUrl);
  if (pending) return pending;

  const request = fetch(`${API_BASE_URL}/api/diary/link-previews/resolve`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: normalizedUrl }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error('Link preview could not be loaded');
      return (await response.json()) as LinkPreviewMetadata;
    })
    .then((metadata) => {
      cache.set(normalizedUrl, metadata);
      return metadata;
    })
    .finally(() => inFlight.delete(normalizedUrl));

  inFlight.set(normalizedUrl, request);
  return request;
};
