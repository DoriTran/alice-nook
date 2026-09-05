import type { ColorId } from '@/packages/color';
import type { IconId } from '@/packages/icon';

export type TagTone = 'purple' | 'pink' | 'yellow' | 'teal' | 'blue';

export type ChatboxListTag = {
  label: string;
  count: number;
  colorId: ColorId;
};

export type HeaderTag = {
  label: string;
  tone?: TagTone;
};

export type ChatboxData = {
  id: string;
  name: string;
  description: string;
  preview: string;
  tags: ChatboxListTag[];
  icon: IconId;
  colorId: ColorId;
  paletteSoft: string;
  paletteMain: string;
  paletteStrong: string;
  iconBg: string;
  pinned: boolean;
  archived: boolean;
  hasUnread: boolean;
  notificationEnabled: boolean;
  notificationRinging: boolean;
  totalMessage: number;
  lastMessageAt: string | null;
  createdAt: string;
};

export type GroupData = {
  id: string;
  title: string;
  brushColor: string;
  groupIcon: IconId;
  chatboxes: ChatboxData[];
};

export type DiaryFilterTab = 'all' | 'pinned' | 'recent' | 'archived';

export type MessageAuthor = 'ai' | 'user';

export type MessageTextBlock = {
  type: 'text';
  content: string;
};

export type MessageListBlock = {
  type: 'list';
  items: string[];
};

export type MessageTimerBlock = {
  type: 'timer';
  label: string;
  duration: string;
};

export type MessageBlock =
  | MessageTextBlock
  | MessageListBlock
  | MessageTimerBlock;

export type MessageItem = {
  id: string;
  author: MessageAuthor;
  blocks: MessageBlock[];
  time: string;
  reaction?: { emoji: string; count: number };
  read?: boolean;
};

export type MessageDayGroup = {
  date: string;
  messages: MessageItem[];
};

export type MessageThreadData = {
  chatboxId: string;
  groups: MessageDayGroup[];
};

export type ChatboxDetailData = {
  id: string;
  title: string;
  subtitle: string;
  tags: HeaderTag[];
  notificationCount?: number;
};

export type MediaFilter = 'all' | 'images' | 'videos' | 'links' | 'files';

export type DetailPanelTab = 'overview' | 'media' | 'settings';
