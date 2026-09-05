// #region Store

import type { RichTextContent } from '@/packages/base/AdRichText/types';
import type { ColorId, CustomPalette } from '@/packages/color';
import type { IconId } from '@/packages/icon';

export type { RichTextContent };

export type DiaryStore = {
  groups: Record<string, Group>;
  chatboxes: Record<string, Chatbox>;
  messages: Record<string, Message>;
  tags: Record<string, Tag>;
  customPalettes: Record<string, CustomPalette>;
  orders: Orders;
};

// #endregion

// #region Actions
export type DiaryStoreActions = {
  // #region Group

  createGroup: (data?: Partial<Group>) => string;
  updateGroup: (groupId: string, data: Partial<Group>) => void;
  deleteGroup: (groupId: string) => void;

  // #endregion

  // #region Chatbox

  createChatbox: (data?: Partial<Chatbox>) => string;
  updateChatbox: (chatboxId: string, data: ChatboxUpdateData) => void;
  moveChatboxToGroup: (chatboxId: string, targetGroupId: string | null) => void;
  deleteChatbox: (chatboxId: string) => void;

  // #endregion

  // #region Message

  createMessage: (data: Partial<Message>) => string;
  updateMessage: (messageId: string, data: MessageUpdateData) => void;
  patchMessage: (messageId: string, data: MessagePatchData) => void;
  deleteMessage: (messageId: string) => void;
  moveMessage: (messageId: string, targetChatboxId: string) => void;
  toggleMessagePin: (messageId: string) => void;
  toggleMessageArchive: (messageId: string) => void;
  toggleMessageReaction: (messageId: string, emoji: string) => void;
  setMessageTags: (messageId: string, tagIds: string[]) => void;
  forwardMessage: (
    sourceMessageId: string,
    targetChatboxId: string,
    caption?: string,
  ) => string;

  // #endregion

  // #region Tag

  createTag: (data?: Partial<Tag>) => string;
  updateTag: (tagId: string, data: Partial<Tag>) => void;
  deleteTag: (tagId: string) => void;
  removeTagFromChatbox: (chatboxId: string, tagId: string) => void;

  // #endregion

  // #region Custom Palette

  createCustomPalette: (data: {
    name: string;
    description?: string;
    baseColor: string;
    light: CustomPalette['light'];
    dark: CustomPalette['dark'];
  }) => ColorId;
  deleteCustomPalette: (paletteId: string) => void;

  // #endregion

  // #region Orders

  updateRootOrders: (ids: string[]) => void;
  updateGroupChatboxOrders: (groupId: string, ids: string[]) => void;
  updateChatboxMessageOrders: (chatboxId: string, ids: string[]) => void;
  syncSidebarLayout: (layout: {
    rootOrders: string[];
    groupChatboxOrders: Record<string, string[]>;
  }) => void;

  // #endregion

  // #region Utility

  reset: () => void;
  seedIfEmpty: () => void;

  // #endregion
};

// #endregion

// #endregion

// #region Orders

export type Orders = {
  rootOrders: string[];
  groupChatboxOrders: Record<string, string[]>;
  chatboxMessageOrders: Record<string, string[]>;
};

// #endregion

// #region Group

export type Group = {
  id: string;
  name: string;
  icon: string;
  colorId: ColorId;

  createdAt: string;
  updatedAt: string | null;
};

// #endregion

// #region [Chatbox]
export type Chatbox = {
  id: string;
  groupId: string | null;
  name: string;
  description: string;
  icon: string;
  colorId: ColorId;

  pinned: boolean;
  archived: boolean;
  hasUnread: boolean;
  notificationEnabled: boolean;
  notificationRinging: boolean;
  tags: ChatboxTagStatistic[];
  totalMessage: number;
  lastMessageId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type ChatboxTagStatistic = {
  tagId: string;
  count: number;
};

export type ChatboxUpdateData = Partial<
  Pick<
    Chatbox,
    | 'name'
    | 'description'
    | 'icon'
    | 'colorId'
    | 'pinned'
    | 'archived'
    | 'hasUnread'
    | 'notificationEnabled'
    | 'notificationRinging'
  >
> & {
  tags?: ChatboxTagStatistic[];
};

// #endregion

// #region [Tag]

export type Tag = {
  id: string;
  label: string;
  colorId: ColorId;
};

// #endregion

// #region [Message]

// #region Shared

// RichTextContent is defined in @/packages/base (TipTap JSON + preview cache).

// #endregion

// #region Attachments

export type Attachment =
  | ImageAttachment
  | VideoAttachment
  | AudioAttachment
  | DocumentAttachment
  | NoteAttachment
  | ArchiveAttachment
  | CodeAttachment
  | FileAttachment
  | LinkAttachment;

export type AttachmentType = Attachment['type'];

export type AttachmentBase = {
  id: string;
  name?: string;
};

/** Shared shape for non-media binary attachments (audio/document/note/archive/code/file). */
export type BinaryAttachmentBase = AttachmentBase & {
  url: string;
  mimeType: string;
  size?: number;
};

export type ImageAttachment = AttachmentBase & {
  type: 'image';
  url: string;
  width?: number;
  height?: number;
};

export type VideoAttachment = AttachmentBase & {
  type: 'video';
  url: string;
  thumbnail?: string;
  duration?: number;
};

export type AudioAttachment = BinaryAttachmentBase & {
  type: 'audio';
  duration?: number;
};

export type DocumentAttachment = BinaryAttachmentBase & {
  type: 'document';
};

export type NoteAttachment = BinaryAttachmentBase & {
  type: 'note';
};

export type ArchiveAttachment = BinaryAttachmentBase & {
  type: 'archive';
};

export type CodeAttachment = BinaryAttachmentBase & {
  type: 'code';
};

/** Catch-all binary attachment when no more specific kind matches. */
export type FileAttachment = BinaryAttachmentBase & {
  type: 'file';
};

export type LinkAttachment = AttachmentBase & {
  type: 'link';
  url: string;
  /** Optional Open Graph / page preview image when metadata is available. */
  previewUrl?: string;
  previewTitle?: string;
};

export type BinaryAttachment =
  | AudioAttachment
  | DocumentAttachment
  | NoteAttachment
  | ArchiveAttachment
  | CodeAttachment
  | FileAttachment;

// #endregion

// #region Message Decorator
export type MessageDecorator = TicketDecorator | TimerDecorator;

export type TicketDecorator = {
  type: 'ticket';
  state: 'todo' | 'doing' | 'done';
  ticked: boolean;
  placement?: 'inside' | 'outside';
};

export type TimerMode = 'timer' | 'countup' | 'datetime';

export type TimerDecorator = {
  type: 'timer';
  mode: TimerMode;
  pause: boolean;
  running: boolean;
  durationMs: number;
  /** Configured duration captured at compose time; used to reset. */
  initialDurationMs: number;
  startedAt: string | null;
  targetDate: string;
  /** ISO deadline when timer/datetime mode is running */
  deadlineAt: string | null;
  /** ISO timestamp recording that the current deadline already raised a ring. */
  alertedAt: string | null;
};

// #endregion

// #region Message Variants
export type Message = TextMessage | TodoMessage | AIMessage;

export type MessageSender = 'user' | 'assistant';

export type MessageBase = {
  id: string;
  chatboxId: string;
  sender: MessageSender;
  tagIds: string[];
  pinned: boolean;
  archived: boolean;
  replyToMessageId: string | null;
  sourceMessageId: string | null;
  reactions: MessageReaction[];
  edited: boolean;
  attachments: Attachment[];
  decorators: MessageDecorator[];
  createdAt: string;
  updatedAt: string | null;
};

export type MessageReaction = {
  emoji: string;
  count: number;
};

export type TextMessage = MessageBase & {
  variant: 'text';
  content: RichTextContent;
};

export type AIMessage = MessageBase & {
  variant: 'ai';
  content: RichTextContent;
};

export type TodoMessage = MessageBase & {
  variant: 'todo';
  content: {
    items: TodoItem[];
  };
};

export type TodoItem = {
  id: string;
  completed: boolean;
  content: RichTextContent;
  attachments: Attachment[];
};
// #endregion

// #endregion

// #region [Helpers]

/* eslint-disable @typescript-eslint/no-duplicate-type-constituents -- semantic id unions (all `string` today) */
export type DiaryEntityId =
  | Group['id']
  | Chatbox['id']
  | Message['id']
  | Tag['id'];
export type DiaryRootItemId = Group['id'] | Chatbox['id'];
/* eslint-enable @typescript-eslint/no-duplicate-type-constituents */

export type MessageVariant = Message['variant'];

export type MessageUpdateData = Partial<
  Omit<Message, 'id' | 'chatboxId' | 'createdAt' | 'edited' | 'updatedAt'>
>;

export type MessagePatchData = Partial<
  Pick<
    Message,
    | 'tagIds'
    | 'pinned'
    | 'archived'
    | 'reactions'
    | 'replyToMessageId'
    | 'sourceMessageId'
    | 'decorators'
    | 'content'
  >
>;

// #endregion

// #region Message Preview

export type PreviewSource =
  | 'variant'
  | 'decorator'
  | 'attachment'
  | 'reply'
  | 'normal';

export type PreviewTile =
  | {
      kind: 'media';
      thumbnailUrl: string;
      mediaType: 'image' | 'video';
    }
  | {
      kind: 'link';
      url: string;
      hostname: string;
      previewUrl?: string;
      previewTitle?: string;
    }
  | {
      kind: 'file';
      extension: string;
      name?: string;
    };

export type MessagePreviewStyle = {
  /** PascalCase Lucide IconId */
  icon: IconId;
  iconBg: string;
  iconColor: string;
};

export type MessagePreviewResolution = {
  source: PreviewSource;
  icon: IconId;
  iconBg: string;
  iconColor: string;
  title: string;
  timeLabel: string;
  preview: PreviewTile | null;
  attachmentCount: number;
  /** Winning attachment type when source is attachment (for debugging / tests). */
  attachmentType?: AttachmentType;
};

// #endregion
