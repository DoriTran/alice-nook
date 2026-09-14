import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  FREQUENT_EMOJI_LIMIT,
  isValidEmojiPrefId,
} from '@/packages/base/AdEmojiPicker/data';
import { isValidColorId, RECENT_COLOR_LIMIT } from '@/packages/color';
import { isValidIconId, RECENT_ICON_LIMIT } from '@/packages/icon';

import type { AppStore, ColorPickerPrefs } from './type';

import { getDiaryCustomPalettes } from '../diary/facade';
import shallow from '../shallow';
import {
  DEFAULT_COLOR_PICKER_PREFS,
  DEFAULT_DIARY_PAGE,
  DEFAULT_EMOJI_PICKER_PREFS,
  DEFAULT_ICON_PICKER_PREFS,
  DEFAULT_NAV_PANEL,
} from './constants';

const useAppStoreBase = create<AppStore>()(
  persist(
    (set) => ({
      navPanel: DEFAULT_NAV_PANEL,
      diaryPage: DEFAULT_DIARY_PAGE,
      iconPickerPrefs: DEFAULT_ICON_PICKER_PREFS,
      emojiPickerPrefs: DEFAULT_EMOJI_PICKER_PREFS,
      colorPickerPrefs: DEFAULT_COLOR_PICKER_PREFS,

      setNavPanelFolded: (folded) =>
        set((state) => ({
          navPanel: {
            ...state.navPanel,
            folded,
          },
        })),

      selectChatbox: (chatboxId) =>
        set((state) => ({
          diaryPage: {
            ...state.diaryPage,
            selectedChatboxId: chatboxId,
          },
        })),

      toggleGroup: (groupId) =>
        set((state) => {
          const next = new Set(state.diaryPage.expandedGroupIds);

          if (next.has(groupId)) {
            next.delete(groupId);
          } else {
            next.add(groupId);
          }

          return {
            diaryPage: {
              ...state.diaryPage,
              expandedGroupIds: next,
            },
          };
        }),

      expandGroup: (groupId) =>
        set((state) => {
          const next = new Set(state.diaryPage.expandedGroupIds);
          next.add(groupId);

          return {
            diaryPage: {
              ...state.diaryPage,
              expandedGroupIds: next,
            },
          };
        }),

      collapseGroup: (groupId) =>
        set((state) => {
          const next = new Set(state.diaryPage.expandedGroupIds);
          next.delete(groupId);

          return {
            diaryPage: {
              ...state.diaryPage,
              expandedGroupIds: next,
            },
          };
        }),

      addRecentIcon: (iconId) =>
        set((state) => {
          if (!isValidIconId(iconId)) {
            return state;
          }

          const recent = [
            iconId,
            ...state.iconPickerPrefs.recent.filter((id) => id !== iconId),
          ].slice(0, RECENT_ICON_LIMIT);

          return {
            iconPickerPrefs: {
              ...state.iconPickerPrefs,
              recent,
            },
          };
        }),

      clearRecentIcons: () =>
        set((state) => ({
          iconPickerPrefs: {
            ...state.iconPickerPrefs,
            recent: [],
          },
        })),

      toggleFavoriteIcon: (iconId) =>
        set((state) => {
          if (!isValidIconId(iconId)) {
            return state;
          }

          const favorites = state.iconPickerPrefs.favorites.includes(iconId)
            ? state.iconPickerPrefs.favorites.filter((id) => id !== iconId)
            : [...state.iconPickerPrefs.favorites, iconId];

          return {
            iconPickerPrefs: {
              ...state.iconPickerPrefs,
              favorites,
            },
          };
        }),

      setFavoriteIcons: (iconIds) =>
        set((state) => ({
          iconPickerPrefs: {
            ...state.iconPickerPrefs,
            favorites: iconIds.filter(isValidIconId),
          },
        })),

      addFrequentEmoji: (emojiId) =>
        set((state) => {
          if (!isValidEmojiPrefId(emojiId)) {
            return state;
          }

          const frequent = [
            emojiId,
            ...state.emojiPickerPrefs.frequent.filter((id) => id !== emojiId),
          ].slice(0, FREQUENT_EMOJI_LIMIT);

          return {
            emojiPickerPrefs: {
              ...state.emojiPickerPrefs,
              frequent,
            },
          };
        }),

      clearFrequentEmojis: () =>
        set((state) => ({
          emojiPickerPrefs: {
            ...state.emojiPickerPrefs,
            frequent: [],
          },
        })),

      toggleFavoriteEmoji: (emojiId) =>
        set((state) => {
          if (!isValidEmojiPrefId(emojiId)) {
            return state;
          }

          const favorites = state.emojiPickerPrefs.favorites.includes(emojiId)
            ? state.emojiPickerPrefs.favorites.filter((id) => id !== emojiId)
            : [...state.emojiPickerPrefs.favorites, emojiId];

          return {
            emojiPickerPrefs: {
              ...state.emojiPickerPrefs,
              favorites,
            },
          };
        }),

      setFavoriteEmojis: (emojiIds) =>
        set((state) => ({
          emojiPickerPrefs: {
            ...state.emojiPickerPrefs,
            favorites: emojiIds.filter(isValidEmojiPrefId),
          },
        })),

      addRecentColor: (colorId) =>
        set((state) => {
          const customPalettes = getDiaryCustomPalettes();

          if (!isValidColorId(colorId, customPalettes)) {
            return state;
          }

          const recent = [
            colorId,
            ...state.colorPickerPrefs.recent.filter((id) => id !== colorId),
          ].slice(0, RECENT_COLOR_LIMIT);

          return {
            colorPickerPrefs: {
              ...state.colorPickerPrefs,
              recent,
            },
          };
        }),

      removeRecentColor: (colorId) =>
        set((state) => {
          const recent = state.colorPickerPrefs.recent.filter(
            (id) => id !== colorId,
          );

          if (recent.length === state.colorPickerPrefs.recent.length) {
            return state;
          }

          return {
            colorPickerPrefs: {
              ...state.colorPickerPrefs,
              recent,
            },
          };
        }),

      clearRecentColors: () =>
        set((state) => ({
          colorPickerPrefs: {
            ...state.colorPickerPrefs,
            recent: [],
          },
        })),
    }),
    {
      name: 'dear-diary-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        navPanel: state.navPanel,
        iconPickerPrefs: state.iconPickerPrefs,
        emojiPickerPrefs: state.emojiPickerPrefs,
        colorPickerPrefs: state.colorPickerPrefs,
        diaryPage: {
          selectedChatboxId: state.diaryPage.selectedChatboxId,
          expandedGroupIds: Array.from(state.diaryPage.expandedGroupIds),
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as {
          navPanel?: typeof DEFAULT_NAV_PANEL;
          iconPickerPrefs?: typeof DEFAULT_ICON_PICKER_PREFS;
          emojiPickerPrefs?: typeof DEFAULT_EMOJI_PICKER_PREFS;
          colorPickerPrefs?: ColorPickerPrefs;
          diaryPage?: {
            selectedChatboxId?: string | null;
            expandedGroupIds?: string[];
          };
        };

        return {
          ...currentState,
          ...persisted,
          navPanel: {
            ...currentState.navPanel,
            ...persisted.navPanel,
          },
          iconPickerPrefs: {
            ...currentState.iconPickerPrefs,
            ...persisted.iconPickerPrefs,
            recent: persisted.iconPickerPrefs?.recent ?? [],
            favorites: persisted.iconPickerPrefs?.favorites ?? [],
          },
          emojiPickerPrefs: {
            ...currentState.emojiPickerPrefs,
            ...persisted.emojiPickerPrefs,
            frequent: persisted.emojiPickerPrefs?.frequent ?? [],
            favorites: persisted.emojiPickerPrefs?.favorites ?? [],
          },
          colorPickerPrefs: {
            ...currentState.colorPickerPrefs,
            ...persisted.colorPickerPrefs,
            recent: persisted.colorPickerPrefs?.recent ?? [],
          },
          diaryPage: {
            ...currentState.diaryPage,
            ...persisted.diaryPage,
            expandedGroupIds: new Set(
              persisted.diaryPage?.expandedGroupIds ?? [],
            ),
          },
        };
      },
    },
  ),
);

export const useAppStore = shallow(useAppStoreBase);
