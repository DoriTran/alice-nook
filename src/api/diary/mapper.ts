import type { DiaryStore, Message } from '@/store/diary/type';

import {
  mergeSecretHydrations,
  setCloudSecretEnabled,
} from '@/packages/base/AdRichText/extensions/contentSecret';
import { migrateDiaryRichTextState } from '@/store/migrateRichText';

import type { DiarySnapshotResponse, DiaryMessageResponse } from './types';

const toRecord = <T extends { id: string }>(items: T[]): Record<string, T> =>
  Object.fromEntries(items.map((item) => [item.id, item]));

export const mapDiarySnapshot = (
  snapshot: DiarySnapshotResponse,
): DiaryStore => {
  mergeSecretHydrations(snapshot.secretHydrations);
  setCloudSecretEnabled(snapshot.capabilities?.cloudSecret ?? false);
  return migrateDiaryRichTextState({
    groups: toRecord(snapshot.groups),
    chatboxes: toRecord(
      snapshot.chatboxes.map((chatbox) => ({
        ...chatbox,
        colorId: chatbox.colorId,
        notificationRinging: false,
      })),
    ),
    messages: toRecord(snapshot.messages),
    tags: toRecord(
      snapshot.tags.map((tag) => ({ ...tag, colorId: tag.colorId })),
    ),
    customPalettes: toRecord(snapshot.palettes),
    orders: {
      rootOrders: [...snapshot.orders.rootOrders],
      groupChatboxOrders: { ...snapshot.orders.groupChatboxOrders },
      chatboxMessageOrders: { ...snapshot.orders.chatboxMessageOrders },
    },
  });
};

export const mapDiaryMessageResponse = (
  response: DiaryMessageResponse,
): Message => {
  const { secretHydrations, ...message } = response;
  mergeSecretHydrations(secretHydrations);
  return message;
};

const sanitizeCloudValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    if (/^(blob:|data:)/i.test(value)) {
      throw new Error('Temporary attachment URLs cannot be saved to Cloud.');
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizeCloudValue);
  if (!value || typeof value !== 'object') return value;

  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(record)
      .filter(([key]) => key !== 'file' && key !== 'status')
      .map(([key, entry]) => [key, sanitizeCloudValue(entry)]),
  );
};

export const sanitizeMessageForCloud = <T extends Partial<Message>>(
  message: T,
): T => sanitizeCloudValue(message) as T;
