import type { LinkPreviewMetadata } from '@/store/diary/type';

import { apiRequest } from '../client';

const cache = new Map<string, LinkPreviewMetadata>();
const inFlight = new Map<string, Promise<LinkPreviewMetadata>>();

export const resolveLinkPreview = (
  normalizedUrl: string,
): Promise<LinkPreviewMetadata> => {
  const cached = cache.get(normalizedUrl);
  if (cached) return Promise.resolve(cached);
  const pending = inFlight.get(normalizedUrl);
  if (pending) return pending;

  const request = apiRequest<LinkPreviewMetadata>(
    '/api/diary/link-previews/resolve',
    {
      method: 'POST',
      body: JSON.stringify({ url: normalizedUrl }),
    },
  )
    .then((metadata) => {
      cache.set(normalizedUrl, metadata);
      return metadata;
    })
    .finally(() => inFlight.delete(normalizedUrl));

  inFlight.set(normalizedUrl, request);
  return request;
};
