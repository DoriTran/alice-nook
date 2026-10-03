import type { Attachment } from '@/store/diary/type';

const DUMMY_PREFIX = '/dummy/';

const LOREM_VIDEO_SOURCES = ['bunny', 'cat', 'corgi', 'test'] as const;

const placeholderImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/1920/1280`;

/** Short H.264 clip from https://lorem.video — CORS-enabled, no signup. */
const placeholderVideo = (seed: string) => {
  const source =
    LOREM_VIDEO_SOURCES[
      Math.abs(
        seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0),
      ) % LOREM_VIDEO_SOURCES.length
    ];

  return `https://lorem.video/${source}_640x360_h264_10s_30fps.mp4`;
};

const dummySeed = (url: string) =>
  url.slice(DUMMY_PREFIX.length).replace(/\.[^.]+$/, '') || 'dear-diary';

export const isDummyAttachmentUrl = (url: string): boolean =>
  url.startsWith(DUMMY_PREFIX);

/** Map mock `/dummy/...` paths to reachable example media URLs. */
export const resolveAttachmentUrl = (
  url: string,
  type?: Attachment['type'],
): string => {
  if (!isDummyAttachmentUrl(url)) {
    return url;
  }

  if (type === 'video') {
    return placeholderVideo(dummySeed(url));
  }

  return placeholderImage(dummySeed(url));
};

export const resolveAttachmentThumbnail = (
  attachment: Extract<Attachment, { type: 'image' | 'video' }>,
): string => {
  if (attachment.type === 'image') {
    return attachment.url ? resolveAttachmentUrl(attachment.url, 'image') : '';
  }

  if (attachment.thumbnail && !isDummyAttachmentUrl(attachment.thumbnail)) {
    return attachment.thumbnail;
  }

  return attachment.url
    ? placeholderImage(`${dummySeed(attachment.url)}-thumb`)
    : '';
};
