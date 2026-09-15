import { v4 as uuidv4 } from 'uuid';
import { useShallow } from 'zustand/react/shallow';

import { ApiError, diaryApi } from '@/api';
import { sanitizeMessageForCloud } from '@/api/diary/mapper';
import { showAdNotification } from '@/packages/base';
import { migratePlainTextToRichText } from '@/packages/base/AdRichText/richtext';
import {
  DEFAULT_COLOR_ID,
  generatePaletteFromBase,
  toCustomColorId,
} from '@/packages/color';
import { getDiaryDataSource, useSettingsStore } from '@/store/settings/store';

import type {
  ActiveDiaryStore,
  DiaryAsyncStoreActions,
  DiaryStore,
  Message,
  MessagePatchData,
} from './type';

import {
  getCloudMessageSyncEntry,
  getCloudDiaryState,
  setCloudMessageSyncEntry,
  updateCloudDiary,
  useCloudDiaryStoreBase,
  useCloudMessageSyncStore,
  type CloudMessagePayload,
} from './cloudStore';
import { reconcileCloudDiary, runCloudMutation } from './source';
import {
  getLocalDiaryCustomPalettes,
  recalculateChatboxDerivedFields,
  useDiaryHydrated,
  useLocalDiaryStoreBase,
} from './store';

const actionKeys = new Set<keyof DiaryAsyncStoreActions>([
  'createGroup',
  'updateGroup',
  'deleteGroup',
  'createChatbox',
  'updateChatbox',
  'moveChatboxToGroup',
  'deleteChatbox',
  'createMessage',
  'updateMessage',
  'patchMessage',
  'deleteMessage',
  'moveMessage',
  'cloneMessage',
  'toggleMessagePin',
  'toggleMessageArchive',
  'toggleMessageReaction',
  'setMessageTags',
  'forwardMessage',
  'createTag',
  'updateTag',
  'deleteTag',
  'removeTagFromChatbox',
  'createCustomPalette',
  'deleteCustomPalette',
  'updateRootOrders',
  'updateGroupChatboxOrders',
  'updateChatboxMessageOrders',
  'syncSidebarLayout',
  'reset',
  'seedIfEmpty',
]);

const isLocal = () => getDiaryDataSource() === 'local';

const callLocal = <Key extends keyof DiaryAsyncStoreActions>(
  key: Key,
  ...args: Parameters<DiaryAsyncStoreActions[Key]>
): Promise<Awaited<ReturnType<DiaryAsyncStoreActions[Key]>>> => {
  const action = useLocalDiaryStoreBase.getState()[key] as (
    ...values: unknown[]
  ) => unknown;
  return Promise.resolve(
    action(...args) as Awaited<ReturnType<DiaryAsyncStoreActions[Key]>>,
  );
};

const notifyFailure = (error: unknown) => {
  showAdNotification({
    title: 'Cloud Diary could not save',
    message: error instanceof Error ? error.message : 'Please try again.',
    color: 'red',
  });
};

const cloud = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await runCloudMutation(work);
  } catch (error) {
    notifyFailure(error);
    throw error;
  }
};

const cloudState = (): DiaryStore => getCloudDiaryState();

const upsertCloud = <
  Key extends 'groups' | 'chatboxes' | 'messages' | 'tags' | 'customPalettes',
>(
  key: Key,
  value: DiaryStore[Key][string],
) =>
  updateCloudDiary((state) => ({
    ...state,
    [key]: { ...state[key], [value.id]: value },
  }));

const buildCloudMessage = (data: Partial<Message>, id: string): Message => ({
  ...(data as Message),
  id,
  sender: data.sender ?? 'user',
  tagIds: data.tagIds ?? [],
  pinned: data.pinned ?? false,
  archived: data.archived ?? false,
  replyToMessageId: data.replyToMessageId ?? null,
  sourceMessageId: data.sourceMessageId ?? null,
  reactions: data.reactions ?? [],
  attachments: data.attachments ?? [],
  decorators: data.decorators ?? [],
  linkPreview: data.linkPreview ?? null,
  edited: false,
  createdAt: new Date().toISOString(),
  updatedAt: null,
});

const persistOptimisticMessage = async (
  id: string,
  payload: CloudMessagePayload,
  attempt: number,
) => {
  try {
    const canonical = await runCloudMutation(() =>
      diaryApi.createMessage(payload),
    );
    if (getCloudMessageSyncEntry(id)?.attempt !== attempt) return;
    updateCloudDiary((state) => {
      const optimistic = state.messages[id];
      if (!optimistic) return state;
      return recalculateChatboxDerivedFields(
        {
          ...state,
          messages: {
            ...state.messages,
            [id]: { ...optimistic, ...canonical, id },
          },
        },
        optimistic.chatboxId,
      );
    });
    setCloudMessageSyncEntry(id, null);
  } catch (error) {
    const current = getCloudMessageSyncEntry(id);
    if (!current || current.attempt !== attempt) throw error;
    if (attempt > 1) {
      try {
        await reconcileCloudDiary();
        if (cloudState().messages[id]) {
          setCloudMessageSyncEntry(id, null);
          return;
        }
      } catch {
        // Keep the original POST error as the retry result.
      }
    }
    notifyFailure(error);
    setCloudMessageSyncEntry(id, { ...current, status: 'failed' });
    throw error;
  }
};

const unsupportedMessageMove = () => {
  const error = new ApiError('Moving messages is not available in Cloud yet.');
  notifyFailure(error);
  return Promise.reject(error);
};

const facadeActions: DiaryAsyncStoreActions = {
  createGroup: async (data = {}) => {
    if (isLocal()) return callLocal('createGroup', data);
    const id = data.id ?? `gr:${uuidv4()}`;
    await cloud(async () => {
      await diaryApi.createGroup({
        id,
        name: data.name ?? '',
        icon: data.icon ?? '',
        colorId: data.colorId ?? DEFAULT_COLOR_ID,
      });
      await reconcileCloudDiary();
    });
    return id;
  },
  updateGroup: async (id, data) => {
    if (isLocal()) return callLocal('updateGroup', id, data);
    await cloud(async () => {
      const group = await diaryApi.updateGroup(id, {
        name: data.name,
        icon: data.icon,
        colorId: data.colorId,
      });
      upsertCloud('groups', group);
    });
  },
  deleteGroup: async (id) => {
    if (isLocal()) return callLocal('deleteGroup', id);
    await cloud(async () => {
      await diaryApi.deleteGroup(id);
      await reconcileCloudDiary();
    });
  },
  createChatbox: async (data = {}) => {
    if (isLocal()) return callLocal('createChatbox', data);
    const id = data.id ?? `cb:${uuidv4()}`;
    await cloud(async () => {
      await diaryApi.createChatbox({
        id,
        name: data.name ?? '',
        description: data.description ?? '',
        icon: data.icon ?? '',
        colorId: data.colorId ?? DEFAULT_COLOR_ID,
        groupId: data.groupId ?? null,
      });
      await reconcileCloudDiary();
    });
    return id;
  },
  updateChatbox: async (id, data) => {
    if (isLocal()) return callLocal('updateChatbox', id, data);
    const current = cloudState().chatboxes[id];
    if (!current) return;
    const { notificationRinging, hasUnread, ...persisted } = data;
    if (notificationRinging !== undefined || hasUnread !== undefined) {
      upsertCloud('chatboxes', {
        ...current,
        ...(notificationRinging === undefined ? {} : { notificationRinging }),
        ...(hasUnread === undefined ? {} : { hasUnread }),
      });
    }
    if (Object.keys(persisted).length > 0) {
      await cloud(async () => {
        const chatbox = await diaryApi.updateChatbox(id, persisted);
        upsertCloud('chatboxes', {
          ...chatbox,
          notificationRinging:
            cloudState().chatboxes[id]?.notificationRinging ?? false,
        });
      });
    }
  },
  moveChatboxToGroup: async (id, groupId) => {
    if (isLocal()) return callLocal('moveChatboxToGroup', id, groupId);
    await cloud(async () => {
      await diaryApi.moveChatbox(id, groupId);
      await reconcileCloudDiary();
    });
  },
  deleteChatbox: async (id) => {
    if (isLocal()) return callLocal('deleteChatbox', id);
    await cloud(async () => {
      await diaryApi.deleteChatbox(id);
      await reconcileCloudDiary();
    });
  },
  createMessage: async (data) => {
    if (isLocal()) return callLocal('createMessage', data);
    if (!data.chatboxId) return '';
    const id = data.id ?? `ms:${uuidv4()}`;
    const message = buildCloudMessage(data, id);
    const {
      edited: _edited,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      ...request
    } = message;
    const payload = sanitizeMessageForCloud(request) as CloudMessagePayload;
    const attempt = 1;
    setCloudMessageSyncEntry(id, { status: 'pending', payload, attempt });
    updateCloudDiary((state) => {
      const ids = state.orders.chatboxMessageOrders[message.chatboxId] ?? [];
      return recalculateChatboxDerivedFields(
        {
          ...state,
          messages: { ...state.messages, [id]: message },
          orders: {
            ...state.orders,
            chatboxMessageOrders: {
              ...state.orders.chatboxMessageOrders,
              [message.chatboxId]: ids.includes(id) ? ids : [...ids, id],
            },
          },
        },
        message.chatboxId,
      );
    });
    await persistOptimisticMessage(id, payload, attempt);
    return id;
  },
  updateMessage: async (id, data) => {
    if (isLocal()) return callLocal('updateMessage', id, data);
    const current = cloudState().messages[id];
    if (!current) return;
    const message = sanitizeMessageForCloud({ ...current, ...data } as Message);
    upsertCloud(
      'messages',
      await cloud(async () =>
        diaryApi.editMessage(id, {
          variant: message.variant,
          content: message.content,
          attachments: message.attachments,
          decorators: message.decorators,
          linkPreview: message.linkPreview,
          replyToMessageId: message.replyToMessageId,
        }),
      ),
    );
  },
  patchMessage: async (id, data: MessagePatchData) => {
    if (isLocal()) return callLocal('patchMessage', id, data);
    if (data.tagIds) return facadeActions.setMessageTags(id, data.tagIds);
    const current = cloudState().messages[id];
    if (!current) return;
    const patch = sanitizeMessageForCloud({
      pinned: data.pinned,
      archived: data.archived,
      reactions: data.reactions,
      decorators: data.decorators,
      ...(current.variant === 'todo' ? { content: data.content } : {}),
      linkPreview: data.linkPreview,
    } as Partial<Message>);
    const compact = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    );
    if (!Object.keys(compact).length) return;
    upsertCloud(
      'messages',
      await cloud(() => diaryApi.patchMessage(id, compact)),
    );
  },
  deleteMessage: async (id) => {
    if (isLocal()) return callLocal('deleteMessage', id);
    await cloud(async () => {
      await diaryApi.deleteMessage(id);
      await reconcileCloudDiary();
    });
  },
  moveMessage: async (id, targetId) =>
    isLocal()
      ? callLocal('moveMessage', id, targetId)
      : unsupportedMessageMove(),
  cloneMessage: async (sourceId, targetId) => {
    if (isLocal()) return callLocal('cloneMessage', sourceId, targetId);
    const source = cloudState().messages[sourceId];
    if (!source) return '';
    return facadeActions.createMessage({
      ...structuredClone(source),
      id: undefined,
      chatboxId: targetId,
      pinned: false,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
    });
  },
  toggleMessagePin: async (id) => {
    const current = (
      isLocal() ? useLocalDiaryStoreBase.getState() : cloudState()
    ).messages[id];
    if (current)
      await facadeActions.patchMessage(id, { pinned: !current.pinned });
  },
  toggleMessageArchive: async (id) => {
    const current = (
      isLocal() ? useLocalDiaryStoreBase.getState() : cloudState()
    ).messages[id];
    if (current)
      await facadeActions.patchMessage(id, { archived: !current.archived });
  },
  toggleMessageReaction: async (id, emoji) => {
    const current = (
      isLocal() ? useLocalDiaryStoreBase.getState() : cloudState()
    ).messages[id];
    if (!current) return;
    const exists = current.reactions.some(
      (reaction) => reaction.emoji === emoji && reaction.count > 0,
    );
    const reactions = exists
      ? current.reactions.filter((reaction) => reaction.emoji !== emoji)
      : [
          ...current.reactions.filter((reaction) => reaction.emoji !== emoji),
          { emoji, count: 1 },
        ];
    await facadeActions.patchMessage(id, { reactions });
  },
  setMessageTags: async (id, tagIds) => {
    if (isLocal()) return callLocal('setMessageTags', id, tagIds);
    await cloud(async () => {
      await diaryApi.setMessageTags(id, tagIds);
      await reconcileCloudDiary();
    });
  },
  forwardMessage: async (sourceId, targetId, caption) => {
    if (isLocal())
      return callLocal('forwardMessage', sourceId, targetId, caption);
    const source = cloudState().messages[sourceId];
    if (!source) return '';
    return facadeActions.createMessage({
      chatboxId: targetId,
      sender: 'user',
      variant: 'text',
      content: migratePlainTextToRichText(caption?.trim() ?? ''),
      sourceMessageId: source.sourceMessageId ?? sourceId,
    } as Partial<Message>);
  },
  createTag: async (data = {}) => {
    if (isLocal()) return callLocal('createTag', data);
    const id = data.id ?? `tag:${uuidv4()}`;
    upsertCloud(
      'tags',
      await cloud(() =>
        diaryApi.createTag({
          id,
          label: data.label ?? '',
          colorId: data.colorId ?? DEFAULT_COLOR_ID,
        }),
      ),
    );
    return id;
  },
  updateTag: async (id, data) => {
    if (isLocal()) return callLocal('updateTag', id, data);
    upsertCloud(
      'tags',
      await cloud(() =>
        diaryApi.updateTag(id, { label: data.label, colorId: data.colorId }),
      ),
    );
  },
  deleteTag: async (id) => {
    if (isLocal()) return callLocal('deleteTag', id);
    await cloud(async () => {
      await diaryApi.deleteTag(id);
      await reconcileCloudDiary();
    });
  },
  removeTagFromChatbox: async (chatboxId, tagId) => {
    if (isLocal()) return callLocal('removeTagFromChatbox', chatboxId, tagId);
    await cloud(async () => {
      await diaryApi.removeTagFromChatbox(chatboxId, tagId);
      await reconcileCloudDiary();
    });
  },
  createCustomPalette: async (data) => {
    if (isLocal()) return callLocal('createCustomPalette', data);
    const id = uuidv4();
    const generated = generatePaletteFromBase(data.baseColor);
    upsertCloud(
      'customPalettes',
      await cloud(() =>
        diaryApi.createPalette({
          id,
          name: data.name.trim() || 'Custom Palette',
          description: data.description?.trim() || undefined,
          baseColor: data.baseColor,
          light: data.light ?? generated.light,
          dark: data.dark ?? generated.dark,
        }),
      ),
    );
    return toCustomColorId(id);
  },
  deleteCustomPalette: async (id) => {
    if (isLocal()) return callLocal('deleteCustomPalette', id);
    await cloud(async () => {
      await diaryApi.deletePalette(id);
      updateCloudDiary((state) => {
        const { [id]: _removed, ...customPalettes } = state.customPalettes;
        return { ...state, customPalettes };
      });
    });
  },
  updateRootOrders: async (ids) => {
    if (isLocal()) return callLocal('updateRootOrders', ids);
    await facadeActions.syncSidebarLayout({
      rootOrders: ids,
      groupChatboxOrders: cloudState().orders.groupChatboxOrders,
    });
  },
  updateGroupChatboxOrders: async (groupId, ids) => {
    if (isLocal()) return callLocal('updateGroupChatboxOrders', groupId, ids);
    await facadeActions.syncSidebarLayout({
      rootOrders: cloudState().orders.rootOrders,
      groupChatboxOrders: {
        ...cloudState().orders.groupChatboxOrders,
        [groupId]: ids,
      },
    });
  },
  updateChatboxMessageOrders: async (chatboxId, ids) =>
    isLocal()
      ? callLocal('updateChatboxMessageOrders', chatboxId, ids)
      : unsupportedMessageMove(),
  syncSidebarLayout: async (layout) => {
    if (isLocal()) return callLocal('syncSidebarLayout', layout);
    const previous = cloudState().orders;
    const optimistic = { ...previous, ...layout };
    updateCloudDiary((state) => ({ ...state, orders: optimistic }));
    try {
      const orders = await cloud(() =>
        diaryApi.syncSidebar(layout.rootOrders, layout.groupChatboxOrders),
      );
      updateCloudDiary((state) => ({
        ...state,
        orders: { ...state.orders, ...orders },
      }));
    } catch (error) {
      if (cloudState().orders === optimistic) {
        updateCloudDiary((state) => ({ ...state, orders: previous }));
      }
      throw error;
    }
  },
  reset: async () => (isLocal() ? callLocal('reset') : Promise.resolve()),
  seedIfEmpty: async () =>
    isLocal() ? callLocal('seedIfEmpty') : Promise.resolve(),
};

export function useDiaryStore<Key extends keyof ActiveDiaryStore>(
  key: Key,
): ActiveDiaryStore[Key];
export function useDiaryStore<Key extends keyof ActiveDiaryStore>(
  keys: readonly Key[],
): Pick<ActiveDiaryStore, Key>;
export function useDiaryStore<Key extends keyof ActiveDiaryStore>(
  keyOrKeys: Key | readonly Key[],
): ActiveDiaryStore[Key] | Pick<ActiveDiaryStore, Key> {
  const source = useSettingsStore('diaryDataSource');
  const local = useLocalDiaryStoreBase(useShallow((state) => state));
  const cloudSnapshot = useCloudDiaryStoreBase(useShallow((state) => state));
  const active = source === 'local' ? local : cloudSnapshot;
  const select = (key: Key): ActiveDiaryStore[Key] =>
    actionKeys.has(key as keyof DiaryAsyncStoreActions)
      ? (facadeActions[
          key as keyof DiaryAsyncStoreActions
        ] as ActiveDiaryStore[Key])
      : (active[key as keyof DiaryStore] as ActiveDiaryStore[Key]);
  if (Array.isArray(keyOrKeys)) {
    return Object.fromEntries(
      keyOrKeys.map((key) => [key, select(key)]),
    ) as Pick<ActiveDiaryStore, Key>;
  }
  return select(keyOrKeys as Key);
}

export { useDiaryHydrated };

export const getDiaryCustomPalettes = () =>
  getDiaryDataSource() === 'local'
    ? getLocalDiaryCustomPalettes()
    : getCloudDiaryState().customPalettes;

export const useMessageSyncStatus = (
  messageId: string,
): 'pending' | 'sent' | 'failed' => {
  const source = useSettingsStore('diaryDataSource');
  const status = useCloudMessageSyncStore(
    (state) => state.entries[messageId]?.status,
  );
  return source === 'cloud' ? (status ?? 'sent') : 'sent';
};

export const retryMessage = async (messageId: string): Promise<void> => {
  if (isLocal()) return;
  const current = getCloudMessageSyncEntry(messageId);
  if (!current || current.status !== 'failed') return;
  const attempt = current.attempt + 1;
  setCloudMessageSyncEntry(messageId, {
    ...current,
    status: 'pending',
    attempt,
  });
  await persistOptimisticMessage(messageId, current.payload, attempt);
};
