import { migratePlainTextToRichText } from '@/packages/base/AdRichText/richtext';

import type { DiaryStore, MessagePreviewStyle } from './type';

import {
  ATTACHMENT_KINDS,
  getAttachmentPreviewStyle,
} from './attachment.registry';

export { ATTACHMENT_TYPE_PRIORITY } from './attachment.registry';

// #region Initial State

export const diaryInitialState: DiaryStore = {
  groups: {},
  chatboxes: {},
  messages: {},
  tags: {},
  customPalettes: {},
  orders: {
    rootOrders: [],
    groupChatboxOrders: {},
    chatboxMessageOrders: {},
  },
};

// #endregion

// #region Dummy State

export const diaryDummyState: DiaryStore = {
  // #region Groups

  groups: {
    'gr:personal': {
      id: 'gr:personal',
      name: 'Personal',
      icon: 'Heart',
      colorId: 'rose',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: null,
    },
    'gr:work': {
      id: 'gr:work',
      name: 'Work',
      icon: 'Briefcase',
      colorId: 'violet',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: null,
    },
    'gr:entertainment': {
      id: 'gr:entertainment',
      name: 'Entertainment',
      icon: 'Clapperboard',
      colorId: 'matcha',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: null,
    },
  },

  // #endregion

  // #region Tags

  tags: {
    'tag:important': {
      id: 'tag:important',
      label: 'Important',
      colorId: 'coral',
    },
    'tag:japanese': {
      id: 'tag:japanese',
      label: 'Japanese',
      colorId: 'sky',
    },
    'tag:project': {
      id: 'tag:project',
      label: 'Project',
      colorId: 'plum',
    },
    'tag:anime': {
      id: 'tag:anime',
      label: 'Anime',
      colorId: 'mint',
    },
    'tag:vocabulary': {
      id: 'tag:vocabulary',
      label: 'vocabulary',
      colorId: 'rose',
    },
    'tag:grammar': {
      id: 'tag:grammar',
      label: 'grammar',
      colorId: 'mint',
    },
    'tag:diary': {
      id: 'tag:diary',
      label: 'diary',
      colorId: 'rose',
    },
  },

  // #endregion

  // #region Chatboxes

  chatboxes: {
    'cb:study': {
      id: 'cb:study',
      groupId: 'gr:personal',
      name: 'Japanese Study',
      icon: 'BookOpen',
      colorId: 'lavender',
      description:
        "A place to organize my Japanese study materials, vocabulary, grammar, and daily progress. Let's grow together!",
      pinned: true,
      archived: false,
      hasUnread: true,
      notificationEnabled: true,
      tags: [
        { tagId: 'tag:japanese', count: 6 },
        { tagId: 'tag:vocabulary', count: 1 },
      ],
      totalMessage: 7,
      lastMessageId: 'ms:study-last',
      lastMessageAt: '2026-06-09T10:30:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-06-09T10:30:00.000Z',
    },
    'cb:diary': {
      id: 'cb:diary',
      groupId: 'gr:personal',
      name: 'Daily Diary',
      icon: 'PenLine',
      colorId: 'rose',
      description: 'Personal reflections and daily notes.',
      pinned: false,
      archived: true,
      hasUnread: false,
      notificationEnabled: false,
      tags: [{ tagId: 'tag:diary', count: 1 }],
      totalMessage: 1,
      lastMessageId: 'ms:diary-1',
      lastMessageAt: '2026-06-08T09:15:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-06-08T09:15:00.000Z',
    },
    'cb:project': {
      id: 'cb:project',
      groupId: 'gr:work',
      name: 'Dear Diary',
      icon: 'Sparkles',
      colorId: 'violet',
      description: 'Dear Diary architecture and development.',
      pinned: false,
      archived: false,
      hasUnread: true,
      notificationEnabled: false,
      tags: [
        { tagId: 'tag:project', count: 2 },
        { tagId: 'tag:important', count: 1 },
      ],
      totalMessage: 2,
      lastMessageId: 'ms:project-2',
      lastMessageAt: '2026-01-10T20:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-10T20:00:00.000Z',
    },
    'cb:anime': {
      id: 'cb:anime',
      groupId: 'gr:entertainment',
      name: 'Anime Watchlist',
      icon: 'Clapperboard',
      colorId: 'matcha',
      description: 'Anime watchlist and episode notes.',
      pinned: false,
      archived: false,
      hasUnread: false,
      notificationEnabled: true,
      tags: [{ tagId: 'tag:anime', count: 1 }],
      totalMessage: 1,
      lastMessageId: 'ms:anime-1',
      lastMessageAt: '2026-01-15T21:00:00.000Z',
      createdAt: '2026-01-15T21:00:00.000Z',
      updatedAt: '2026-01-15T21:00:00.000Z',
    },
  },

  // #endregion

  // #region Messages

  messages: {
    'ms:study-text': {
      id: 'ms:study-text',
      chatboxId: 'cb:study',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText('Learn 20 new Japanese words today.'),
      attachments: [],
      decorators: [],
      tagIds: ['tag:japanese'],
      pinned: false,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-01-03T08:00:00.000Z',
      updatedAt: null,
    },
    'ms:study-todo': {
      id: 'ms:study-todo',
      chatboxId: 'cb:study',
      sender: 'user',
      variant: 'todo',
      content: {
        items: [
          {
            id: 'todo:1',
            content: migratePlainTextToRichText('N5 Vocabulary'),
            completed: true,
            attachments: [],
          },
          {
            id: 'todo:2',
            content: migratePlainTextToRichText('N5 Grammar'),
            completed: false,
            attachments: [],
          },
        ],
      },
      attachments: [],
      decorators: [],
      tagIds: ['tag:japanese'],
      pinned: true,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-01-04T09:00:00.000Z',
      updatedAt: null,
    },
    'ms:study-image': {
      id: 'ms:study-image',
      chatboxId: 'cb:study',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText('Mountain photos from our trip ...'),
      attachments: [
        {
          id: 'att:study-image-1',
          type: 'image',
          url: '/dummy/mountain-1.png',
          width: 1280,
          height: 720,
        },
        {
          id: 'att:study-image-2',
          type: 'image',
          url: '/dummy/mountain-2.png',
          width: 1280,
          height: 720,
        },
        {
          id: 'att:study-image-3',
          type: 'image',
          url: '/dummy/mountain-3.png',
          width: 1280,
          height: 720,
        },
        {
          id: 'att:study-image-4',
          type: 'image',
          url: '/dummy/mountain-4.png',
          width: 1280,
          height: 720,
        },
        {
          id: 'att:study-image-5',
          type: 'image',
          url: '/dummy/mountain-5.png',
          width: 1280,
          height: 720,
        },
      ],
      decorators: [],
      tagIds: [],
      pinned: true,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [
        {
          emoji: '❤️',
          count: 1,
        },
      ],
      edited: false,
      createdAt: '2026-01-05T10:30:00.000Z',
      updatedAt: null,
    },
    'ms:study-file': {
      id: 'ms:study-file',
      chatboxId: 'cb:study',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText('Important Grammar Notes ...'),
      attachments: [
        {
          id: 'att:study-file-1',
          type: 'document',
          url: '/dummy/grammar-notes.pdf',
          name: 'grammar-notes.pdf',
          mimeType: 'application/pdf',
        },
        {
          id: 'att:study-file-2',
          type: 'document',
          url: '/dummy/particles.pdf',
          name: 'particles.pdf',
          mimeType: 'application/pdf',
        },
        {
          id: 'att:study-file-3',
          type: 'document',
          url: '/dummy/verbs.pdf',
          name: 'verbs.pdf',
          mimeType: 'application/pdf',
        },
      ],
      decorators: [],
      tagIds: ['tag:japanese'],
      pinned: true,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-01-06T11:00:00.000Z',
      updatedAt: null,
    },
    'ms:study-link': {
      id: 'ms:study-link',
      chatboxId: 'cb:study',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText('Useful Japanese Learning Resources'),
      attachments: [
        {
          id: 'att:study-link-1',
          type: 'link',
          url: 'https://www.jlpt.jp/e/',
          name: 'https://www.jlpt.jp/e/',
          previewUrl: 'https://picsum.photos/seed/jlpt-link/640/480',
          previewTitle: 'JLPT Official',
        },
        {
          id: 'att:study-link-2',
          type: 'link',
          url: 'https://jisho.org/',
          name: 'https://jisho.org/',
        },
      ],
      decorators: [],
      tagIds: ['tag:japanese'],
      pinned: true,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-01-07T14:20:00.000Z',
      updatedAt: null,
    },
    'ms:study-timer': {
      id: 'ms:study-timer',
      chatboxId: 'cb:study',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText('JLPT N5 Study Countdown'),
      attachments: [],
      decorators: [
        {
          type: 'timer',
          mode: 'timer',
          pause: true,
          running: false,
          durationMs: 12 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000,
          initialDurationMs: 12 * 60 * 60 * 1000 + 30 * 60 * 1000 + 45 * 1000,
          startedAt: null,
          targetDate: '2026-07-01T00:00:00.000Z',
          deadlineAt: null,
        },
      ],
      tagIds: ['tag:japanese'],
      pinned: true,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-01-04T10:24:00.000Z',
      updatedAt: null,
    },
    'ms:study-last': {
      id: 'ms:study-last',
      chatboxId: 'cb:study',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText(
        'Finished the vocabulary review! The focus timer helped me stay on track for the full session.',
      ),
      attachments: [],
      decorators: [],
      tagIds: ['tag:japanese', 'tag:vocabulary'],
      pinned: false,
      archived: true,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-06-09T10:30:00.000Z',
      updatedAt: null,
    },
    'ms:diary-1': {
      id: 'ms:diary-1',
      chatboxId: 'cb:diary',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText(
        'Had a quiet morning with coffee and notes.',
      ),
      attachments: [],
      decorators: [],
      tagIds: ['tag:diary'],
      pinned: false,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-06-08T09:15:00.000Z',
      updatedAt: null,
    },
    'ms:project-1': {
      id: 'ms:project-1',
      chatboxId: 'cb:project',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText('Finish diary architecture.'),
      attachments: [],
      decorators: [],
      tagIds: ['tag:project', 'tag:important'],
      pinned: false,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-01-09T18:00:00.000Z',
      updatedAt: null,
    },
    'ms:project-2': {
      id: 'ms:project-2',
      chatboxId: 'cb:project',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText('MVP Release'),
      attachments: [],
      decorators: [
        {
          type: 'timer',
          mode: 'datetime',
          pause: false,
          running: false,
          durationMs: 0,
          initialDurationMs: 0,
          startedAt: null,
          targetDate: '2026-02-01T00:00:00.000Z',
          deadlineAt: null,
        },
      ],
      tagIds: ['tag:project'],
      pinned: true,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-01-10T20:00:00.000Z',
      updatedAt: null,
    },
    'ms:anime-1': {
      id: 'ms:anime-1',
      chatboxId: 'cb:anime',
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText('Watch Frieren this weekend.'),
      attachments: [],
      decorators: [],
      tagIds: ['tag:anime'],
      pinned: false,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      edited: false,
      createdAt: '2026-01-15T21:00:00.000Z',
      updatedAt: null,
    },
  },

  // #endregion

  customPalettes: {},

  // #region Orders

  orders: {
    rootOrders: ['gr:personal', 'gr:work', 'gr:entertainment'],
    groupChatboxOrders: {
      'gr:personal': ['cb:study', 'cb:diary'],
      'gr:work': ['cb:project'],
      'gr:entertainment': ['cb:anime'],
    },
    chatboxMessageOrders: {
      'cb:study': [
        'ms:study-text',
        'ms:study-todo',
        'ms:study-timer',
        'ms:study-image',
        'ms:study-file',
        'ms:study-link',
        'ms:study-last',
      ],
      'cb:diary': ['ms:diary-1'],
      'cb:project': ['ms:project-1', 'ms:project-2'],
      'cb:anime': ['ms:anime-1'],
    },
  },

  // #endregion
};

// #endregion

// #region Message Preview

const softPreviewBg = (token: string) =>
  `color-mix(in srgb, ${token} 28%, var(--surface))`;

export const PREVIEW_STYLES = {
  todo: {
    icon: 'ListTodo',
    iconBg: softPreviewBg('var(--secondary)'),
    iconColor: 'var(--secondary-dark)',
  },
  ai: {
    icon: 'Sparkles',
    iconBg: softPreviewBg('var(--accent-purple)'),
    iconColor: 'var(--accent-purple)',
  },
  timer: {
    icon: 'TimerReset',
    iconBg: softPreviewBg('var(--accent-yellow)'),
    iconColor: 'var(--primary-dark)',
  },
  ticket: {
    icon: 'Ticket',
    iconBg: softPreviewBg('var(--primary)'),
    iconColor: 'var(--primary-dark)',
  },
  image: getAttachmentPreviewStyle('image'),
  video: getAttachmentPreviewStyle('video'),
  audio: getAttachmentPreviewStyle('audio'),
  document: getAttachmentPreviewStyle('document'),
  note: getAttachmentPreviewStyle('note'),
  archive: getAttachmentPreviewStyle('archive'),
  code: getAttachmentPreviewStyle('code'),
  file: getAttachmentPreviewStyle('file'),
  link: getAttachmentPreviewStyle('link'),
  reply: {
    icon: 'MessageSquareReply',
    iconBg: softPreviewBg('var(--primary)'),
    iconColor: 'var(--primary-dark)',
  },
  normal: {
    icon: 'MessageCircleMore',
    iconBg: softPreviewBg('var(--cancel)'),
    iconColor: 'var(--cancel)',
  },
} as const satisfies Record<string, MessagePreviewStyle>;

export type PreviewStyleKey = keyof typeof PREVIEW_STYLES;

export const ATTACHMENT_TYPE_STYLE = Object.fromEntries(
  (Object.keys(ATTACHMENT_KINDS) as Array<keyof typeof ATTACHMENT_KINDS>).map(
    (type) => [type, getAttachmentPreviewStyle(type)],
  ),
) as Record<keyof typeof ATTACHMENT_KINDS, MessagePreviewStyle>;

export const getStyleIcon = (key: PreviewStyleKey) => PREVIEW_STYLES[key].icon;

// #endregion
