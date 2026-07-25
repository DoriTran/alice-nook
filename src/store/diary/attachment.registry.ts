import type { IconId } from '@/packages/icon';

import type {
  Attachment,
  AttachmentType,
  BinaryAttachment,
  MessagePreviewStyle,
} from './type';

export type AttachmentMediaBucket = 'image' | 'video' | 'file' | 'link';

export type AttachmentKindConfig = {
  type: AttachmentType;
  lucideIcon: IconId;
  iconBg: string;
  iconColor: string;
  /** Lower number = higher priority when attachment counts tie. */
  priority: number;
  mimePrefixes?: string[];
  extensions?: string[];
  /** Overview / Media tab rollup bucket. */
  mediaBucket: AttachmentMediaBucket;
};

const softBg = (token: string) =>
  `color-mix(in srgb, ${token} 28%, var(--surface))`;

/**
 * Single registry for attachment kinds. To add a new kind later:
 * 1. Add a union member in type.ts
 * 2. Add one entry here (icon, colors, mime/ext, priority, mediaBucket)
 */
export const ATTACHMENT_KINDS: Record<AttachmentType, AttachmentKindConfig> = {
  image: {
    type: 'image',
    lucideIcon: 'Image',
    iconBg: softBg('var(--accent-purple)'),
    iconColor: 'var(--accent-purple)',
    priority: 10,
    mimePrefixes: ['image/'],
    extensions: [
      'png',
      'jpg',
      'jpeg',
      'gif',
      'webp',
      'avif',
      'bmp',
      'svg',
      'heic',
    ],
    mediaBucket: 'image',
  },
  video: {
    type: 'video',
    lucideIcon: 'Video',
    iconBg: softBg('var(--accent-purple)'),
    iconColor: 'var(--accent-purple)',
    priority: 20,
    mimePrefixes: ['video/'],
    extensions: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'],
    mediaBucket: 'video',
  },
  audio: {
    type: 'audio',
    lucideIcon: 'Music',
    iconBg: softBg('var(--accent-yellow)'),
    iconColor: 'var(--primary-dark)',
    priority: 30,
    mimePrefixes: ['audio/'],
    extensions: ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac', 'wma'],
    mediaBucket: 'file',
  },
  document: {
    type: 'document',
    lucideIcon: 'NotepadText',
    iconBg: softBg('var(--accent-green)'),
    iconColor: 'var(--accent-green)',
    priority: 40,
    mimePrefixes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
    ],
    extensions: [
      'pdf',
      'doc',
      'docx',
      'ppt',
      'pptx',
      'xls',
      'xlsx',
      'odt',
      'ods',
      'odp',
    ],
    mediaBucket: 'file',
  },
  note: {
    type: 'note',
    lucideIcon: 'CaseSensitive',
    iconBg: softBg('var(--accent-blue)'),
    iconColor: 'var(--accent-blue)',
    priority: 50,
    mimePrefixes: [
      'text/plain',
      'text/markdown',
      'text/rtf',
      'application/rtf',
    ],
    extensions: ['txt', 'md', 'markdown', 'rtf'],
    mediaBucket: 'file',
  },
  archive: {
    type: 'archive',
    lucideIcon: 'Package',
    iconBg: softBg('var(--primary)'),
    iconColor: 'var(--primary-dark)',
    priority: 60,
    mimePrefixes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/gzip',
      'application/x-tar',
    ],
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'tgz'],
    mediaBucket: 'file',
  },
  code: {
    type: 'code',
    lucideIcon: 'CodeXml',
    iconBg: softBg('var(--accent-purple)'),
    iconColor: 'var(--accent-purple)',
    priority: 70,
    mimePrefixes: [
      'text/javascript',
      'application/javascript',
      'application/json',
      'text/css',
      'text/html',
      'application/xml',
      'text/xml',
    ],
    extensions: [
      'js',
      'jsx',
      'ts',
      'tsx',
      'py',
      'json',
      'css',
      'scss',
      'html',
      'htm',
      'xml',
      'yml',
      'yaml',
      'toml',
      'rs',
      'go',
      'java',
      'c',
      'cpp',
      'h',
      'cs',
      'php',
      'rb',
      'sh',
      'sql',
    ],
    mediaBucket: 'file',
  },
  file: {
    type: 'file',
    lucideIcon: 'File',
    iconBg: softBg('var(--accent-green)'),
    iconColor: 'var(--accent-green)',
    priority: 80,
    mediaBucket: 'file',
  },
  link: {
    type: 'link',
    lucideIcon: 'Link',
    iconBg: softBg('var(--accent-blue)'),
    iconColor: 'var(--accent-blue)',
    priority: 90,
    mediaBucket: 'link',
  },
};

/** Priority order for winning-type ties (lowest priority number first). */
export const ATTACHMENT_TYPE_PRIORITY: AttachmentType[] = Object.values(
  ATTACHMENT_KINDS,
)
  .slice()
  .sort((a, b) => a.priority - b.priority)
  .map((kind) => kind.type);

export const ATTACHMENT_TYPES: AttachmentType[] = ATTACHMENT_TYPE_PRIORITY;

export const getAttachmentKind = (type: AttachmentType): AttachmentKindConfig =>
  ATTACHMENT_KINDS[type];

export const getAttachmentPreviewStyle = (
  type: AttachmentType,
): MessagePreviewStyle => {
  const kind = ATTACHMENT_KINDS[type];

  return {
    icon: kind.lucideIcon,
    iconBg: kind.iconBg,
    iconColor: kind.iconColor,
  };
};

export const getAttachmentMediaBucket = (
  type: AttachmentType,
): AttachmentMediaBucket => ATTACHMENT_KINDS[type].mediaBucket;

export const isBinaryAttachment = (
  attachment: Attachment,
): attachment is BinaryAttachment =>
  getAttachmentMediaBucket(attachment.type) === 'file';

export const isFileBucketAttachment = isBinaryAttachment;

const extensionOf = (fileName: string | undefined): string => {
  if (!fileName) {
    return '';
  }

  const base = fileName.split(/[?#]/)[0]?.split('/').pop() ?? '';
  const dot = base.lastIndexOf('.');

  if (dot <= 0 || dot === base.length - 1) {
    return '';
  }

  return base.slice(dot + 1).toLowerCase();
};

/** Classify a local file into an AttachmentType (never returns `link`). */
export const classifyAttachmentType = (
  mimeType: string | undefined,
  fileName: string | undefined,
): Exclude<AttachmentType, 'link'> => {
  const mime = (mimeType ?? '').toLowerCase();
  const ext = extensionOf(fileName);

  const candidates = ATTACHMENT_TYPE_PRIORITY.filter(
    (type) => type !== 'link' && type !== 'file',
  );

  for (const type of candidates) {
    const kind = ATTACHMENT_KINDS[type];
    if (
      mime &&
      kind.mimePrefixes?.some((prefix) => mime.startsWith(prefix.toLowerCase()))
    ) {
      return type as Exclude<AttachmentType, 'link'>;
    }
  }

  for (const type of candidates) {
    const kind = ATTACHMENT_KINDS[type];
    if (ext && kind.extensions?.includes(ext)) {
      return type as Exclude<AttachmentType, 'link'>;
    }
  }

  return 'file';
};

export const emptyAttachmentTypeCounts = (): Record<AttachmentType, number> => {
  const counts = {} as Record<AttachmentType, number>;

  for (const type of ATTACHMENT_TYPES) {
    counts[type] = 0;
  }

  return counts;
};
