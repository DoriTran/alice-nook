import type { CustomPalette } from '@/packages/color';
import type { Chatbox, Group, Message, Orders, Tag } from '@/store/diary/type';

export type DiarySnapshotResponse = {
  capabilities: { cloudSecret: boolean };
  secretHydrations: Record<string, JSONContent>;
  groups: Group[];
  chatboxes: Array<Omit<Chatbox, 'notificationRinging'>>;
  messages: Message[];
  tags: Tag[];
  palettes: CustomPalette[];
  orders: Orders;
};

export type DiaryMessageResponse = Message & {
  secretHydrations?: Record<string, JSONContent>;
};

export type TimerReconciliationResponse = {
  affectedChatboxIds: string[];
  ringingChatboxIds: string[];
  affectedMessages: Array<{
    messageId: string;
    chatboxId: string;
    decorators: Message['decorators'];
    processedTimers: Array<{
      decoratorIndex: number;
      deadlineAt: string;
      alertedAt: string;
    }>;
  }>;
};

export type SidebarOrdersResponse = Pick<
  Orders,
  'rootOrders' | 'groupChatboxOrders'
> & { chatboxMessageOrders?: Record<string, string[]> };

export type CreateGroupRequest = Pick<
  Group,
  'id' | 'name' | 'icon' | 'colorId'
>;
export type UpdateGroupRequest = Partial<
  Pick<Group, 'name' | 'icon' | 'colorId'>
>;
export type CreateChatboxRequest = Pick<
  Chatbox,
  'id' | 'name' | 'description' | 'icon' | 'colorId' | 'groupId'
>;
export type UpdateChatboxRequest = Partial<
  Pick<
    Chatbox,
    | 'name'
    | 'description'
    | 'icon'
    | 'colorId'
    | 'pinned'
    | 'archived'
    | 'notificationEnabled'
  >
>;
export type CreateTagRequest = Pick<Tag, 'id' | 'label' | 'colorId'>;
export type UpdateTagRequest = Partial<Pick<Tag, 'label' | 'colorId'>>;
export type CreatePaletteRequest = Omit<CustomPalette, 'createdAt'>;
export type CreateMessageRequest = Omit<
  Message,
  'edited' | 'createdAt' | 'updatedAt'
> & {
  secretPayloads?: Array<{
    secretId: string;
    fragment: JSONContent;
  }>;
};
export type PatchMessageRequest = Partial<
  Pick<
    Message,
    | 'pinned'
    | 'archived'
    | 'reactions'
    | 'decorators'
    | 'content'
    | 'linkPreview'
  >
>;
export type EditMessageRequest = Pick<
  Message,
  | 'variant'
  | 'content'
  | 'attachments'
  | 'decorators'
  | 'linkPreview'
  | 'replyToMessageId'
> & {
  secretPayloads?: Array<{
    secretId: string;
    fragment: JSONContent;
  }>;
};
import type { JSONContent } from '@tiptap/core';
