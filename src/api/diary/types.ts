import type { CustomPalette } from '@/packages/color';
import type { Chatbox, Group, Message, Orders, Tag } from '@/store/diary/type';

export type DiarySnapshotResponse = {
  groups: Group[];
  chatboxes: Array<Omit<Chatbox, 'notificationRinging'>>;
  messages: Message[];
  tags: Tag[];
  palettes: CustomPalette[];
  orders: Orders;
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
>;
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
>;
