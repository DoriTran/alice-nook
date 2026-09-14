import type { CustomPalette } from '@/packages/color';
import type { Chatbox, Group, Message, Tag } from '@/store/diary/type';

import type {
  CreateChatboxRequest,
  CreateGroupRequest,
  CreateMessageRequest,
  CreatePaletteRequest,
  CreateTagRequest,
  DiarySnapshotResponse,
  EditMessageRequest,
  PatchMessageRequest,
  SidebarOrdersResponse,
  UpdateChatboxRequest,
  UpdateGroupRequest,
  UpdateTagRequest,
} from './types';

import { apiRequest } from '../client';

const json = (value: unknown) => JSON.stringify(value);

export const diaryApi = {
  getSnapshot: (signal?: AbortSignal) =>
    apiRequest<DiarySnapshotResponse>('/api/diary', { signal }),
  createGroup: (data: CreateGroupRequest) =>
    apiRequest<Group>('/api/diary/groups', {
      method: 'POST',
      body: json(data),
    }),
  updateGroup: (id: string, data: UpdateGroupRequest) =>
    apiRequest<Group>(`/api/diary/groups/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: json(data),
    }),
  deleteGroup: (id: string) =>
    apiRequest<void>(`/api/diary/groups/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  createChatbox: (data: CreateChatboxRequest) =>
    apiRequest<Chatbox>('/api/diary/chatboxes', {
      method: 'POST',
      body: json(data),
    }),
  updateChatbox: (id: string, data: UpdateChatboxRequest) =>
    apiRequest<Chatbox>(`/api/diary/chatboxes/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: json(data),
    }),
  moveChatbox: (id: string, groupId: string | null) =>
    apiRequest<Chatbox>(`/api/diary/chatboxes/${encodeURIComponent(id)}/move`, {
      method: 'POST',
      body: json({ groupId }),
    }),
  deleteChatbox: (id: string) =>
    apiRequest<void>(`/api/diary/chatboxes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  syncSidebar: (
    rootOrders: string[],
    groupChatboxOrders: Record<string, string[]>,
  ) =>
    apiRequest<SidebarOrdersResponse>('/api/diary/orders/sidebar', {
      method: 'PUT',
      body: json({ rootOrders, groupChatboxOrders }),
    }),
  createTag: (data: CreateTagRequest) =>
    apiRequest<Tag>('/api/diary/tags', { method: 'POST', body: json(data) }),
  updateTag: (id: string, data: UpdateTagRequest) =>
    apiRequest<Tag>(`/api/diary/tags/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: json(data),
    }),
  deleteTag: (id: string) =>
    apiRequest<void>(`/api/diary/tags/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  createPalette: (data: CreatePaletteRequest) =>
    apiRequest<CustomPalette>('/api/diary/palettes', {
      method: 'POST',
      body: json(data),
    }),
  deletePalette: (id: string) =>
    apiRequest<void>(`/api/diary/palettes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  createMessage: (data: CreateMessageRequest) =>
    apiRequest<Message>('/api/diary/messages', {
      method: 'POST',
      body: json(data),
    }),
  patchMessage: (id: string, data: PatchMessageRequest) =>
    apiRequest<Message>(`/api/diary/messages/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: json(data),
    }),
  editMessage: (id: string, data: EditMessageRequest) =>
    apiRequest<Message>(`/api/diary/messages/${encodeURIComponent(id)}/edit`, {
      method: 'PUT',
      body: json(data),
    }),
  setMessageTags: (id: string, tagIds: string[]) =>
    apiRequest<Message>(`/api/diary/messages/${encodeURIComponent(id)}/tags`, {
      method: 'PUT',
      body: json({ tagIds }),
    }),
  deleteMessage: (id: string) =>
    apiRequest<void>(`/api/diary/messages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  removeTagFromChatbox: (chatboxId: string, tagId: string) =>
    apiRequest<void>(
      `/api/diary/chatboxes/${encodeURIComponent(chatboxId)}/remove-tag`,
      { method: 'POST', body: json({ tagId }) },
    ),
};
