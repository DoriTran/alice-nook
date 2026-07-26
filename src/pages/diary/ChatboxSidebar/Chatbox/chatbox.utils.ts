import type { ColorId, CustomPalette } from '@/packages/color';
import type { AppMode } from '@/store/app/type';
import type { Chatbox, Message, Tag } from '@/store/diary/type';

import { iconBackground, resolvePalette } from '@/packages/color';
import { normalizeIconId } from '@/packages/icon';
import { decorator } from '@/pages/diary/MessagePanel/DiaryInput';

const { getTimerDisplayText } = decorator;

import type { ChatboxData } from '../../types';

export type ResolvedChatboxTag = {
  label: string;
  count: number;
  colorId: ColorId;
};

export const resolveChatboxPalette = (
  colorId: ColorId,
  mode: AppMode,
  customPalettes: Record<string, CustomPalette> = {},
) => resolvePalette(colorId, mode, customPalettes);

export const buildIconBackground = (
  colorId: ColorId,
  mode: AppMode,
  customPalettes: Record<string, CustomPalette> = {},
) => iconBackground(resolvePalette(colorId, mode, customPalettes));

export const formatTotalMessages = (value: number): string => {
  if (value < 1000) {
    return String(value);
  }

  const compact = Math.floor(value / 100) / 10;
  const formatted = Number.isInteger(compact)
    ? String(compact)
    : compact.toFixed(1);

  return `${formatted}k`;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isYesterday = (date: Date, now: Date) => {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  return isSameDay(date, yesterday);
};

export const formatHeaderActivityAt = (
  iso: string | null,
  kind: 'updated' | 'created' = 'updated',
): string => {
  if (!iso) {
    return '';
  }

  const prefix = kind === 'created' ? 'Created' : 'Updated';
  const date = new Date(iso);
  const now = new Date();

  if (isSameDay(date, now)) {
    return `${prefix} today`;
  }

  if (isYesterday(date, now)) {
    return `${prefix} yesterday`;
  }

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 7) {
    return `${prefix} ${date.toLocaleDateString('en-US', { weekday: 'short' })}`;
  }

  return `${prefix} ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })}`;
};

export const formatHeaderUpdatedAt = (iso: string | null): string =>
  formatHeaderActivityAt(iso, 'updated');

export const formatChatboxTime = (iso: string | null): string => {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  const now = new Date();

  if (isSameDay(date, now)) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (isYesterday(date, now)) {
    return 'Yesterday';
  }

  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const getMessagePreview = (
  message: Message | null | undefined,
): string => {
  if (!message) {
    return '';
  }

  switch (message.variant) {
    case 'text':
    case 'ai': {
      const text = message.content.text.trim();

      if (text) {
        return text;
      }

      if (
        message.attachments.some((attachment) => attachment.type === 'image')
      ) {
        return 'Photo';
      }

      if (
        message.attachments.some((attachment) => attachment.type === 'video')
      ) {
        return 'Video';
      }

      if (
        message.attachments.some(
          (attachment) =>
            attachment.type !== 'image' &&
            attachment.type !== 'video' &&
            attachment.type !== 'link',
        )
      ) {
        return 'File';
      }

      const timer = message.decorators.find(
        (decoration) => decoration.type === 'timer',
      );

      if (timer && timer.type === 'timer') {
        return getTimerDisplayText(timer);
      }

      const ticket = message.decorators.find(
        (decoration) => decoration.type === 'ticket',
      );

      if (ticket) {
        return ticket.state === 'done' ? 'Ticket completed' : 'Ticket';
      }

      return '';
    }
    case 'todo': {
      const first = message.content.items[0];

      return first ? `Todo: ${first.content.text}` : 'Todo list';
    }
    default:
      return '';
  }
};

export const sortTagsByCount = (
  tags: ResolvedChatboxTag[],
): ResolvedChatboxTag[] => [...tags].sort((a, b) => b.count - a.count);

/** Content-box width: clientWidth includes padding, but chips lay out in the content box. */
export const getContentBoxWidth = (element: HTMLElement): number => {
  const style = getComputedStyle(element);
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(style.paddingRight) || 0;

  return element.clientWidth - paddingLeft - paddingRight;
};

export const getFlexGapPx = (element: HTMLElement): number => {
  const style = getComputedStyle(element);
  const gap = Number.parseFloat(style.columnGap || style.gap);

  return Number.isFinite(gap) ? gap : 0;
};

/**
 * Conservative overflow probe label sized to the max digit width of `total`.
 * e.g. under 10 → "+9", under 100 → "+99", under 1000 → "+999".
 */
export const getOverflowProbeLabel = (total: number): string => {
  if (total <= 0) {
    return '+9';
  }

  return `+${'9'.repeat(String(total).length)}`;
};

/**
 * Width-based tag fit. When not all tags fit, `overflowChipWidth` (e.g. measured
 * `+9` / `+99` / `+999`) is reserved so the trailing +N chip never clips.
 */
export const calculateFittingTagCount = (
  tagWidths: number[],
  containerWidth: number,
  gap: number,
  overflowChipWidth: number,
): { visibleCount: number; overflowCount: number } => {
  const total = tagWidths.length;

  if (total === 0 || containerWidth <= 0) {
    return { visibleCount: 0, overflowCount: 0 };
  }

  const totalWidth =
    tagWidths.reduce((sum, width) => sum + width, 0) + gap * (total - 1);

  if (totalWidth <= containerWidth) {
    return { visibleCount: total, overflowCount: 0 };
  }

  for (let visible = total - 1; visible >= 1; visible -= 1) {
    const tagsWidth =
      tagWidths.slice(0, visible).reduce((sum, width) => sum + width, 0) +
      gap * (visible - 1);
    // One gap between the last visible tag and the +N chip.
    const needed = tagsWidth + gap + overflowChipWidth;

    if (needed <= containerWidth) {
      return { visibleCount: visible, overflowCount: total - visible };
    }
  }

  // Nothing fits with a leading tag — show only +N (may still clip if too narrow).
  return { visibleCount: 0, overflowCount: total };
};

export type MapChatboxDataOptions = {
  mode: AppMode;
  customPalettes: Record<string, CustomPalette>;
};

export const mapChatboxData = (
  chatbox: Chatbox,
  tags: Record<string, Tag>,
  lastMessage: Message | null | undefined,
  { mode, customPalettes }: MapChatboxDataOptions,
): ChatboxData => {
  const palette = resolvePalette(chatbox.colorId, mode, customPalettes);

  const resolvedTags = chatbox.tags
    .map((stat) => {
      const tag = tags[stat.tagId];

      if (!tag) {
        return null;
      }

      return {
        label: tag.label,
        count: stat.count,
        colorId: tag.colorId,
      };
    })
    .filter((tag): tag is NonNullable<typeof tag> => tag !== null);

  return {
    id: chatbox.id,
    name: chatbox.name,
    description: chatbox.description,
    preview: getMessagePreview(lastMessage),
    tags: resolvedTags,
    icon: normalizeIconId(chatbox.icon),
    colorId: chatbox.colorId,
    paletteSoft: palette.soft,
    paletteMain: palette.main,
    paletteStrong: palette.strong,
    iconBg: palette.soft,
    pinned: chatbox.pinned,
    archived: chatbox.archived,
    hasUnread: chatbox.hasUnread,
    notificationEnabled: chatbox.notificationEnabled,
    totalMessage: chatbox.totalMessage,
    lastMessageAt: chatbox.lastMessageAt,
    createdAt: chatbox.createdAt,
  };
};
