import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DEFAULT_COLOR_ID,
  toCustomColorId,
  generatePaletteFromBase,
} from '@/packages/color';

import type {
  DiaryStore,
  DiaryStoreActions,
  Group,
  Chatbox,
  ChatboxUpdateData,
  Message,
  MessageUpdateData,
  Tag,
} from './type';

import { migratePlainTextToRichText } from '@/packages/base/AdRichText/richtext';

import { idbStorage, nowIso } from '../helper';
import { migrateDiaryPersistedState } from '../migrateColorId';
import { migrateDiaryIconState } from '../migrateIconId';
import { migrateDiaryRichTextState } from '../migrateRichText';
import shallow from '../shallow';
import { diaryDummyState, diaryInitialState } from './constants';

// #region Helpers

const ensureUnique = <T>(items: T[]) => {
  return Array.from(new Set(items));
};

const recalculateChatboxMetadata = (
  state: DiaryStore,
  chatboxId: string,
): DiaryStore => {
  const chatbox = state.chatboxes[chatboxId];

  if (!chatbox) {
    return state;
  }

  const messageIds = state.orders.chatboxMessageOrders[chatboxId] ?? [];

  const totalMessage = messageIds.length;

  const lastMessageId = messageIds.at(-1) ?? null;

  const lastMessageAt = lastMessageId
    ? (state.messages[lastMessageId]?.createdAt ?? null)
    : null;

  return {
    ...state,
    chatboxes: {
      ...state.chatboxes,
      [chatboxId]: {
        ...chatbox,
        totalMessage,
        lastMessageId,
        lastMessageAt,
      },
    },
  };
};

const recalculateChatboxTags = (
  state: DiaryStore,
  chatboxId: string,
): DiaryStore => {
  const chatbox = state.chatboxes[chatboxId];

  if (!chatbox) {
    return state;
  }

  const counts = new Map<string, number>();

  const messageIds = state.orders.chatboxMessageOrders[chatboxId] ?? [];

  messageIds.forEach((messageId) => {
    const message = state.messages[messageId];

    if (!message) {
      return;
    }

    message.tagIds.forEach((tagId) => {
      counts.set(tagId, (counts.get(tagId) ?? 0) + 1);
    });
  });

  const tags = Array.from(counts.entries()).map(([tagId, count]) => ({
    tagId,
    count,
  }));

  return {
    ...state,
    chatboxes: {
      ...state.chatboxes,
      [chatboxId]: {
        ...chatbox,
        tags,
      },
    },
  };
};

// #endregion

const useDiaryStoreBase = create<DiaryStore & DiaryStoreActions>()(
  persist(
    (set, get) => ({
      ...diaryInitialState,

      // #region Group
      createGroup: (data: Partial<Group> = {}) => {
        const id = data.id ?? `gr:${uuidv4()}`;

        const now = nowIso();

        const group: Group = {
          id,
          name: data.name ?? '',
          icon: data.icon ?? '',
          colorId: data.colorId ?? DEFAULT_COLOR_ID,
          createdAt: now,
          updatedAt: null,
        };

        set((state) => ({
          groups: {
            ...state.groups,
            [id]: group,
          },
          orders: {
            ...state.orders,
            rootOrders: [...state.orders.rootOrders, id],
            groupChatboxOrders: {
              ...state.orders.groupChatboxOrders,
              [id]: [],
            },
          },
        }));

        return id;
      },
      updateGroup: (groupId, data) =>
        set((state) => {
          const current = state.groups[groupId];

          if (!current) {
            return state;
          }

          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...current,
                ...data,
                id: groupId,
                updatedAt: nowIso(),
              },
            },
          };
        }),
      deleteGroup: (groupId) =>
        set((state) => {
          const group = state.groups[groupId];

          if (!group) {
            return state;
          }

          const { [groupId]: _removedGroup, ...groups } = state.groups;

          const { [groupId]: childChatboxes = [], ...groupChatboxOrders } =
            state.orders.groupChatboxOrders;

          const chatboxes = {
            ...state.chatboxes,
          };

          childChatboxes.forEach((chatboxId) => {
            const chatbox = chatboxes[chatboxId];

            if (!chatbox) {
              return;
            }

            chatboxes[chatboxId] = {
              ...chatbox,
              groupId: null,
              updatedAt: nowIso(),
            };
          });

          return {
            groups,
            chatboxes,
            orders: {
              ...state.orders,
              rootOrders: state.orders.rootOrders
                .filter((id) => id !== groupId)
                .concat(childChatboxes),
              groupChatboxOrders,
            },
          };
        }),
      // #endregion

      // #region Chatbox
      createChatbox: (data: Partial<Chatbox> = {}) => {
        const id = data.id ?? `cb:${uuidv4()}`;

        const now = nowIso();

        const groupId = data.groupId ?? null;

        const chatbox: Chatbox = {
          id,
          groupId,
          name: data.name ?? '',
          description: data.description ?? '',
          icon: data.icon ?? '',
          colorId: data.colorId ?? DEFAULT_COLOR_ID,
          pinned: false,
          archived: false,
          hasUnread: false,
          notificationEnabled: false,
          tags: data.tags ?? [],
          totalMessage: 0,
          lastMessageId: null,
          lastMessageAt: null,
          createdAt: now,
          updatedAt: null,
        };

        set((state) => {
          const orders = {
            ...state.orders,
            rootOrders: [...state.orders.rootOrders],
            groupChatboxOrders: {
              ...state.orders.groupChatboxOrders,
            },
            chatboxMessageOrders: {
              ...state.orders.chatboxMessageOrders,
            },
          };

          if (groupId) {
            orders.groupChatboxOrders[groupId] = [
              ...(orders.groupChatboxOrders[groupId] ?? []),
              id,
            ];
          } else {
            orders.rootOrders.push(id);
          }

          orders.chatboxMessageOrders[id] = [];

          return {
            chatboxes: {
              ...state.chatboxes,
              [id]: chatbox,
            },
            orders,
          };
        });

        return id;
      },
      updateChatbox: (chatboxId, data: ChatboxUpdateData) =>
        set((state) => {
          const current = state.chatboxes[chatboxId];

          if (!current) {
            return state;
          }

          const { tags: nextTags, ...rest } = data;

          return {
            chatboxes: {
              ...state.chatboxes,
              [chatboxId]: {
                ...current,
                ...rest,
                id: chatboxId,
                groupId: current.groupId,
                tags: nextTags ?? current.tags,
                totalMessage: current.totalMessage,
                lastMessageId: current.lastMessageId,
                lastMessageAt: current.lastMessageAt,
                createdAt: current.createdAt,
                updatedAt: nowIso(),
              },
            },
          };
        }),
      moveChatboxToGroup: (chatboxId, targetGroupId) =>
        set((state) => {
          const chatbox = state.chatboxes[chatboxId];

          if (!chatbox) {
            return state;
          }

          const sourceGroupId = chatbox.groupId;

          if (sourceGroupId === targetGroupId) {
            return state;
          }

          const orders = {
            ...state.orders,
            rootOrders: [...state.orders.rootOrders],
            groupChatboxOrders: {
              ...state.orders.groupChatboxOrders,
            },
          };

          if (sourceGroupId) {
            orders.groupChatboxOrders[sourceGroupId] = (
              orders.groupChatboxOrders[sourceGroupId] ?? []
            ).filter((id) => id !== chatboxId);
          } else {
            orders.rootOrders = orders.rootOrders.filter(
              (id) => id !== chatboxId,
            );
          }

          if (targetGroupId) {
            orders.groupChatboxOrders[targetGroupId] = [
              ...(orders.groupChatboxOrders[targetGroupId] ?? []),
              chatboxId,
            ];
          } else {
            orders.rootOrders.push(chatboxId);
          }

          return {
            chatboxes: {
              ...state.chatboxes,
              [chatboxId]: {
                ...chatbox,
                groupId: targetGroupId,
                updatedAt: nowIso(),
              },
            },
            orders,
          };
        }),
      deleteChatbox: (chatboxId) =>
        set((state) => {
          const current = state.chatboxes[chatboxId];

          if (!current) {
            return state;
          }

          const { [chatboxId]: _removedChatbox, ...chatboxes } =
            state.chatboxes;

          const { [chatboxId]: messageIds = [], ...chatboxMessageOrders } =
            state.orders.chatboxMessageOrders;

          const messages = {
            ...state.messages,
          };

          messageIds.forEach((messageId) => {
            delete messages[messageId];
          });

          const orders = {
            ...state.orders,
            rootOrders: state.orders.rootOrders.filter(
              (id) => id !== chatboxId,
            ),
            groupChatboxOrders: {
              ...state.orders.groupChatboxOrders,
            },
            chatboxMessageOrders,
          };

          if (current.groupId) {
            orders.groupChatboxOrders[current.groupId] = (
              orders.groupChatboxOrders[current.groupId] ?? []
            ).filter((id) => id !== chatboxId);
          }

          return {
            chatboxes,
            messages,
            orders,
          };
        }),
      // #endregion

      // #region Message
      createMessage: (data) => {
        const id = data.id ?? `ms:${uuidv4()}`;

        const chatboxId = data.chatboxId;

        if (!chatboxId) {
          return '';
        }

        const message: Message = {
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
          edited: false,
          createdAt: nowIso(),
          updatedAt: null,
        };

        set((state) => {
          let nextState: DiaryStore = {
            ...state,
            messages: {
              ...state.messages,
              [id]: message,
            },
            orders: {
              ...state.orders,
              chatboxMessageOrders: {
                ...state.orders.chatboxMessageOrders,
                [chatboxId]: [
                  ...(state.orders.chatboxMessageOrders[chatboxId] ?? []),
                  id,
                ],
              },
            },
          };

          nextState = recalculateChatboxMetadata(nextState, chatboxId);

          nextState = recalculateChatboxTags(nextState, chatboxId);

          return nextState;
        });

        return id;
      },
      updateMessage: (messageId, data: MessageUpdateData) =>
        set((state) => {
          const current = state.messages[messageId];

          if (!current) {
            return state;
          }

          let nextState: DiaryStore = {
            ...state,
            messages: {
              ...state.messages,
              [messageId]: {
                ...current,
                ...data,
                id: messageId,
                chatboxId: current.chatboxId,
                edited: true,
                updatedAt: nowIso(),
              } as Message,
            },
          };

          nextState = recalculateChatboxTags(nextState, current.chatboxId);

          return nextState;
        }),
      patchMessage: (messageId, data) =>
        set((state) => {
          const current = state.messages[messageId];

          if (!current) {
            return state;
          }

          let nextState: DiaryStore = {
            ...state,
            messages: {
              ...state.messages,
              [messageId]: {
                ...current,
                ...data,
                id: messageId,
                chatboxId: current.chatboxId,
                updatedAt: nowIso(),
              } as Message,
            },
          };

          nextState = recalculateChatboxTags(nextState, current.chatboxId);

          return nextState;
        }),
      deleteMessage: (messageId) =>
        set((state) => {
          const current = state.messages[messageId];

          if (!current) {
            return state;
          }

          const { [messageId]: _removedMessage, ...messages } = state.messages;

          let nextState: DiaryStore = {
            ...state,
            messages,
            orders: {
              ...state.orders,
              chatboxMessageOrders: {
                ...state.orders.chatboxMessageOrders,
                [current.chatboxId]: (
                  state.orders.chatboxMessageOrders[current.chatboxId] ?? []
                ).filter((id) => id !== messageId),
              },
            },
          };

          nextState = recalculateChatboxMetadata(nextState, current.chatboxId);

          nextState = recalculateChatboxTags(nextState, current.chatboxId);

          return nextState;
        }),
      moveMessage: (messageId, targetChatboxId) =>
        set((state) => {
          const message = state.messages[messageId];

          if (!message) {
            return state;
          }

          const sourceChatboxId = message.chatboxId;

          if (sourceChatboxId === targetChatboxId) {
            return state;
          }

          let nextState: DiaryStore = {
            ...state,
            messages: {
              ...state.messages,
              [messageId]: {
                ...message,
                chatboxId: targetChatboxId,
                updatedAt: nowIso(),
              },
            },
            orders: {
              ...state.orders,
              chatboxMessageOrders: {
                ...state.orders.chatboxMessageOrders,
                [sourceChatboxId]: (
                  state.orders.chatboxMessageOrders[sourceChatboxId] ?? []
                ).filter((id) => id !== messageId),
                [targetChatboxId]: [
                  ...(state.orders.chatboxMessageOrders[targetChatboxId] ?? []),
                  messageId,
                ],
              },
            },
          };

          nextState = recalculateChatboxMetadata(nextState, sourceChatboxId);

          nextState = recalculateChatboxMetadata(nextState, targetChatboxId);

          nextState = recalculateChatboxTags(nextState, sourceChatboxId);

          nextState = recalculateChatboxTags(nextState, targetChatboxId);

          return nextState;
        }),
      toggleMessagePin: (messageId) => {
        const current = get().messages[messageId];

        if (!current) {
          return;
        }

        get().patchMessage(messageId, { pinned: !current.pinned });
      },
      toggleMessageArchive: (messageId) => {
        const current = get().messages[messageId];

        if (!current) {
          return;
        }

        get().patchMessage(messageId, { archived: !current.archived });
      },
      toggleMessageReaction: (messageId, emoji) => {
        const current = get().messages[messageId];

        if (!current) {
          return;
        }

        const existing = current.reactions.find(
          (reaction) => reaction.emoji === emoji,
        );

        const reactions =
          existing && existing.count > 0
            ? current.reactions.filter((reaction) => reaction.emoji !== emoji)
            : [
                ...current.reactions.filter(
                  (reaction) => reaction.emoji !== emoji,
                ),
                { emoji, count: 1 },
              ];

        get().patchMessage(messageId, { reactions });
      },
      setMessageTags: (messageId, tagIds) => {
        get().patchMessage(messageId, { tagIds });
      },
      forwardMessage: (sourceMessageId, targetChatboxId, caption) => {
        const source = get().messages[sourceMessageId];

        if (!source) {
          return '';
        }

        const rootSourceId = source.sourceMessageId ?? sourceMessageId;

        return get().createMessage({
          chatboxId: targetChatboxId,
          sender: 'user',
          variant: 'text',
          content: migratePlainTextToRichText(caption?.trim() ?? ''),
          sourceMessageId: rootSourceId,
          tagIds: [],
          attachments: [],
          decorators: [],
        });
      },

      // #endregion

      // #region Tag
      createTag: (data: Partial<Tag> = {}) => {
        const id = data.id ?? `tag:${uuidv4()}`;

        const tag: Tag = {
          id,
          label: data.label ?? '',
          colorId: data.colorId ?? DEFAULT_COLOR_ID,
        };

        set((state) => ({
          tags: {
            ...state.tags,
            [id]: tag,
          },
        }));

        return id;
      },
      updateTag: (tagId, data) =>
        set((state) => {
          const current = state.tags[tagId];

          if (!current) {
            return state;
          }

          return {
            tags: {
              ...state.tags,
              [tagId]: {
                ...current,
                ...data,
                id: tagId,
              },
            },
          };
        }),
      deleteTag: (tagId) =>
        set((state) => {
          if (!state.tags[tagId]) {
            return state;
          }

          const { [tagId]: _removedTag, ...tags } = state.tags;

          const affectedChatboxIds = new Set<string>();

          const messages = {
            ...state.messages,
          };

          Object.entries(messages).forEach(([messageId, message]) => {
            if (!message.tagIds.includes(tagId)) {
              return;
            }

            affectedChatboxIds.add(message.chatboxId);

            messages[messageId] = {
              ...message,
              tagIds: message.tagIds.filter((id) => id !== tagId),
              updatedAt: nowIso(),
            };
          });

          let nextState: DiaryStore = {
            ...state,
            tags,
            messages,
          };

          affectedChatboxIds.forEach((chatboxId) => {
            nextState = recalculateChatboxTags(nextState, chatboxId);
          });

          return nextState;
        }),
      removeTagFromChatbox: (chatboxId, tagId) =>
        set((state) => {
          if (!state.chatboxes[chatboxId] || !state.tags[tagId]) {
            return state;
          }

          const messageIds = state.orders.chatboxMessageOrders[chatboxId] ?? [];
          let changed = false;

          const messages = {
            ...state.messages,
          };

          messageIds.forEach((messageId) => {
            const message = messages[messageId];

            if (!message || !message.tagIds.includes(tagId)) {
              return;
            }

            changed = true;
            messages[messageId] = {
              ...message,
              tagIds: message.tagIds.filter((id) => id !== tagId),
              updatedAt: nowIso(),
            };
          });

          if (!changed) {
            return state;
          }

          return recalculateChatboxTags(
            {
              ...state,
              messages,
            },
            chatboxId,
          );
        }),

      // #endregion

      // #region Custom Palette
      createCustomPalette: (data) => {
        const id = uuidv4();
        const generated = generatePaletteFromBase(data.baseColor);

        const palette = {
          id,
          name: data.name.trim() || 'Custom Palette',
          description: data.description?.trim() || undefined,
          baseColor: data.baseColor,
          light: data.light ?? generated.light,
          dark: data.dark ?? generated.dark,
          createdAt: nowIso(),
        };

        set((state) => ({
          customPalettes: {
            ...state.customPalettes,
            [id]: palette,
          },
        }));

        return toCustomColorId(id);
      },
      deleteCustomPalette: (paletteId) =>
        set((state) => {
          if (!state.customPalettes[paletteId]) {
            return state;
          }

          const { [paletteId]: _removed, ...customPalettes } =
            state.customPalettes;

          return { customPalettes };
        }),
      // #endregion

      // #region Orders
      updateRootOrders: (ids) =>
        set((state) => ({
          orders: {
            ...state.orders,
            rootOrders: ensureUnique(ids),
          },
        })),
      updateGroupChatboxOrders: (groupId, ids) =>
        set((state) => ({
          orders: {
            ...state.orders,
            groupChatboxOrders: {
              ...state.orders.groupChatboxOrders,
              [groupId]: ensureUnique(ids),
            },
          },
        })),
      updateChatboxMessageOrders: (chatboxId, ids) =>
        set((state) => ({
          orders: {
            ...state.orders,
            chatboxMessageOrders: {
              ...state.orders.chatboxMessageOrders,
              [chatboxId]: ensureUnique(ids),
            },
          },
        })),
      syncSidebarLayout: (layout) =>
        set((state) => {
          const rootOrders = ensureUnique(layout.rootOrders);
          const groupChatboxOrders: Record<string, string[]> = {};

          Object.entries(layout.groupChatboxOrders).forEach(
            ([groupId, ids]) => {
              groupChatboxOrders[groupId] = ensureUnique(ids);
            },
          );

          const chatboxesInGroups = new Set<string>();
          Object.values(groupChatboxOrders).forEach((ids) => {
            ids.forEach((id) => chatboxesInGroups.add(id));
          });

          const chatboxes = { ...state.chatboxes };

          rootOrders.forEach((id) => {
            if (!chatboxes[id]) return;
            if (chatboxesInGroups.has(id)) return;

            const current = chatboxes[id];
            if (current.groupId === null) return;

            chatboxes[id] = {
              ...current,
              groupId: null,
              updatedAt: nowIso(),
            };
          });

          Object.entries(groupChatboxOrders).forEach(([groupId, ids]) => {
            ids.forEach((chatboxId) => {
              const current = chatboxes[chatboxId];
              if (!current || current.groupId === groupId) return;

              chatboxes[chatboxId] = {
                ...current,
                groupId,
                updatedAt: nowIso(),
              };
            });
          });

          return {
            chatboxes,
            orders: {
              ...state.orders,
              rootOrders,
              groupChatboxOrders,
            },
          };
        }),
      // #endregion

      // #region Utility
      reset: () =>
        set(() => ({
          ...diaryInitialState,
        })),
      seedIfEmpty: () => {
        if (!useDiaryStoreBase.persist.hasHydrated()) {
          return;
        }

        const state = get();

        if (Object.keys(state.groups).length > 0) {
          return;
        }

        set(() => ({
          ...diaryDummyState,
        }));
      },
      // #endregion
    }),
    {
      name: 'dear-diary',
      storage: idbStorage,
      partialize: (state) => ({
        groups: state.groups,
        chatboxes: state.chatboxes,
        messages: state.messages,
        tags: state.tags,
        customPalettes: state.customPalettes,
        orders: state.orders,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<DiaryStore> | undefined;
        const merged = {
          ...currentState,
          ...persisted,
          orders: {
            ...currentState.orders,
            ...persisted?.orders,
          },
          customPalettes: {
            ...currentState.customPalettes,
            ...persisted?.customPalettes,
          },
        };

        return migrateDiaryRichTextState(
          migrateDiaryIconState(migrateDiaryPersistedState(merged)),
        );
      },
    },
  ),
);

export const useDiaryStore = shallow(useDiaryStoreBase);

export const getDiaryCustomPalettes = () =>
  useDiaryStoreBase.getState().customPalettes;

export const useDiaryHydrated = () => {
  const [hydrated, setHydrated] = useState(() =>
    useDiaryStoreBase.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsub = useDiaryStoreBase.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    setHydrated(useDiaryStoreBase.persist.hasHydrated());

    return unsub;
  }, []);

  return hydrated;
};
