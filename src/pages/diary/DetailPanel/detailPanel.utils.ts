import type { CustomPalette } from '@/packages/color';
import type { AppMode } from '@/store/app/type';
import type {
  Attachment,
  Chatbox,
  Message,
  Orders,
  Tag,
} from '@/store/diary/type';

import { resolveAttachmentThumbnail } from '@/api';
import { resolvePalette } from '@/packages/color';
import { normalizeIconId, type IconId } from '@/packages/icon';
import { getAttachmentMediaBucket } from '@/store/diary/attachment.registry';
import {
  collectMessageAttachments,
  formatMessagePreviewTime,
} from '@/store/diary/messagePreview.utils';

import type { MediaFilter } from '../types';

import {
  formatChatboxTime,
  type ResolvedChatboxTag,
} from '../ChatboxSidebar/Chatbox/chatbox.utils';

export { collectMessageAttachments } from '@/store/diary/messagePreview.utils';

export type DetailPanelStats = {
  totalMessages: number;
  totalAttachments: number;
  imageCount: number;
  videoCount: number;
  fileCount: number;
  linkCount: number;
  updatedLabel: string;
  pinnedCount: number;
  archivedCount: number;
};

export type DetailPanelMediaItem = {
  id: string;
  messageId: string;
  attachment: Attachment;
  createdAt: string;
  timeLabel: string;
};

export type DetailPanelTag = ResolvedChatboxTag & {
  tagId: string;
};

export type DetailPanelIdentity = {
  id: string;
  name: string;
  description: string;
  icon: IconId;
  paletteSoft: string;
  paletteMain: string;
  paletteStrong: string;
  iconBg: string;
  notificationEnabled: boolean;
};

export const getChatboxMessages = (
  chatboxId: string,
  messages: Record<string, Message>,
  orders: Orders,
): Message[] => {
  const messageIds = orders.chatboxMessageOrders[chatboxId] ?? [];

  return messageIds
    .map((messageId) => messages[messageId])
    .filter((message): message is Message => Boolean(message));
};

export const resolveChatboxIdentity = (
  chatbox: Chatbox,
  mode: AppMode,
  customPalettes: Record<string, CustomPalette> = {},
): DetailPanelIdentity => {
  const palette = resolvePalette(chatbox.colorId, mode, customPalettes);

  return {
    id: chatbox.id,
    name: chatbox.name,
    description: chatbox.description,
    icon: normalizeIconId(chatbox.icon),
    paletteSoft: palette.soft,
    paletteMain: palette.main,
    paletteStrong: palette.strong,
    iconBg: palette.soft,
    notificationEnabled: chatbox.notificationEnabled,
  };
};

export const computeDetailPanelStats = (
  chatbox: Chatbox,
  chatboxMessages: Message[],
): DetailPanelStats => {
  let totalAttachments = 0;
  let imageCount = 0;
  let videoCount = 0;
  let fileCount = 0;
  let linkCount = 0;
  let pinnedCount = 0;
  let archivedCount = 0;

  for (const message of chatboxMessages) {
    if (message.pinned) {
      pinnedCount += 1;
    }

    if (message.archived) {
      archivedCount += 1;
    }

    for (const attachment of collectMessageAttachments(message)) {
      totalAttachments += 1;

      switch (getAttachmentMediaBucket(attachment.type)) {
        case 'image':
          imageCount += 1;
          break;
        case 'video':
          videoCount += 1;
          break;
        case 'file':
          fileCount += 1;
          break;
        case 'link':
          linkCount += 1;
          break;
        default:
          break;
      }
    }
  }

  const activityAt =
    chatbox.updatedAt ?? chatbox.lastMessageAt ?? chatbox.createdAt;

  return {
    totalMessages: chatbox.totalMessage,
    totalAttachments,
    imageCount,
    videoCount,
    fileCount,
    linkCount,
    updatedLabel: formatMessagePreviewTime(activityAt),
    pinnedCount,
    archivedCount,
  };
};

export const resolveDetailPanelTags = (
  chatbox: Chatbox,
  tags: Record<string, Tag>,
): DetailPanelTag[] => {
  const resolved = chatbox.tags
    .map((statistic) => {
      const tag = tags[statistic.tagId];

      if (!tag) {
        return null;
      }

      return {
        tagId: tag.id,
        label: tag.label,
        count: statistic.count,
        colorId: tag.colorId,
      };
    })
    .filter((tag): tag is DetailPanelTag => Boolean(tag));

  return [...resolved].sort((a, b) => b.count - a.count);
};

export const collectDetailPanelMedia = (
  chatboxMessages: Message[],
): DetailPanelMediaItem[] => {
  const items: DetailPanelMediaItem[] = [];

  for (const message of chatboxMessages) {
    for (const attachment of collectMessageAttachments(message)) {
      items.push({
        id: `${message.id}:${attachment.id}`,
        messageId: message.id,
        attachment,
        createdAt: message.createdAt,
        timeLabel: formatChatboxTime(message.createdAt),
      });
    }
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const filterMediaItems = (
  items: DetailPanelMediaItem[],
  filter: MediaFilter,
): DetailPanelMediaItem[] => {
  if (filter === 'all') {
    return items;
  }

  const bucketMap: Record<
    Exclude<MediaFilter, 'all'>,
    ReturnType<typeof getAttachmentMediaBucket>
  > = {
    images: 'image',
    videos: 'video',
    links: 'link',
    files: 'file',
  };

  const targetBucket = bucketMap[filter];

  return items.filter(
    (item) => getAttachmentMediaBucket(item.attachment.type) === targetBucket,
  );
};

export type MediaMonthGroup = {
  monthKey: string;
  label: string;
  items: DetailPanelMediaItem[];
};

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
});

export const groupMediaByMonth = (
  items: DetailPanelMediaItem[],
): MediaMonthGroup[] => {
  const groups = new Map<string, MediaMonthGroup>();

  for (const item of items) {
    const date = new Date(item.createdAt);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = groups.get(monthKey);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    groups.set(monthKey, {
      monthKey,
      label: monthLabelFormatter.format(date),
      items: [item],
    });
  }

  return Array.from(groups.values()).sort((a, b) =>
    b.monthKey.localeCompare(a.monthKey),
  );
};

export const getPinnedMessages = (messages: Message[]): Message[] =>
  messages.filter((message) => message.pinned);

export const getArchivedMessages = (messages: Message[]): Message[] =>
  messages.filter((message) => message.archived);

export const filterMessagesByTags = (
  messages: Message[],
  selectedTagIds: string[],
): Message[] => {
  if (selectedTagIds.length === 0) {
    return [];
  }

  return messages.filter((message) =>
    message.tagIds.some((tagId) => selectedTagIds.includes(tagId)),
  );
};

export const getMessageThumbnail = (message: Message): string | undefined => {
  for (const attachment of collectMessageAttachments(message)) {
    if (attachment.type === 'image' || attachment.type === 'video') {
      return resolveAttachmentThumbnail(attachment);
    }
  }

  return undefined;
};

export const formatVideoDuration = (seconds?: number): string | undefined => {
  if (seconds === undefined) {
    return undefined;
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};
