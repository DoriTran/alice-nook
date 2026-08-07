import type {
  Message,
  MessageBase,
  MessageDecorator,
} from '@/store/diary/type';

import { migratePlainTextToRichText } from '@/packages/base/AdRichText/richtext';

const nowIso = new Date().toISOString();
const targetIso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

const base = (
  id: string,
  sender: MessageBase['sender'] = 'user',
  decorators: MessageDecorator[] = [],
): MessageBase => ({
  id,
  chatboxId: 'preview',
  sender,
  tagIds: [],
  pinned: false,
  archived: false,
  replyToMessageId: null,
  sourceMessageId: null,
  reactions: [],
  edited: false,
  attachments: [],
  decorators,
  createdAt: nowIso,
  updatedAt: null,
});

export const PREVIEW_MESSAGES: Message[] = [
  {
    ...base('preview-1'),
    variant: 'text',
    content: migratePlainTextToRichText(
      "Morning! Today I'll focus on studying Japanese grammar ✨",
    ),
  },
  {
    ...base('preview-2', 'user', [
      { type: 'ticket', state: 'todo', ticked: false, placement: 'outside' },
    ]),
    variant: 'text',
    content: migratePlainTextToRichText('Finish grammar exercises'),
  },
  {
    ...base('preview-3', 'user', [
      {
        type: 'timer',
        mode: 'timer',
        pause: false,
        running: false,
        durationMs: 25 * 60 * 1000,
        initialDurationMs: 25 * 60 * 1000,
        startedAt: null,
        targetDate: targetIso,
        deadlineAt: null,
      },
    ]),
    variant: 'text',
    content: migratePlainTextToRichText('Focus session'),
  },
  {
    ...base('preview-4', 'assistant'),
    variant: 'ai',
    content: migratePlainTextToRichText('Great progress today! Keep it up 🌱'),
  },
];
