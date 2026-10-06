import type { LinkPreviewMetadata } from '@/store/diary/type';

export const safeRemoteImage = (value?: string): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

export const getLinkPreviewHostname = (
  url: string,
  metadata?: LinkPreviewMetadata,
) => {
  if (metadata?.hostname) return metadata.hostname;
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
};
