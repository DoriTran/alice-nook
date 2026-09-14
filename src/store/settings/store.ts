import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AppMode, AppTheme } from '../app/type';
import type { DeepPartial, SettingsPreferences, SettingsStore } from './type';

import shallow from '../shallow';
import { DEFAULT_MODE, DEFAULT_PREFERENCES, DEFAULT_THEME } from './constants';

export function applyAppTheme(theme: AppTheme, mode: AppMode) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-mode', mode);
}

/** Deep-merge helper used for partial preference updates (immutable). */
function mergePreferences<T extends Record<string, unknown>>(
  base: T,
  patch: DeepPartial<T>,
): T {
  const result = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(patch) as Array<keyof T & string>) {
    const patchValue = patch[key];

    if (patchValue == null) {
      continue;
    }

    const baseValue = base[key];

    if (
      typeof patchValue === 'object' &&
      !Array.isArray(patchValue) &&
      typeof baseValue === 'object' &&
      baseValue != null &&
      !Array.isArray(baseValue)
    ) {
      result[key] = mergePreferences(
        baseValue as Record<string, unknown>,
        patchValue as DeepPartial<Record<string, unknown>>,
      );
    } else {
      result[key] = patchValue;
    }
  }

  return result as T;
}

const useSettingsStoreBase = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      mode: DEFAULT_MODE,
      diaryDataSource: 'local',
      diaryLocalExplicit: false,
      preferences: DEFAULT_PREFERENCES,

      setTheme: (theme) =>
        set((state) => {
          applyAppTheme(theme, state.mode);
          return { theme };
        }),

      setMode: (mode) =>
        set((state) => {
          applyAppTheme(state.theme, mode);
          return { mode };
        }),

      setDiaryDataSource: (diaryDataSource) => set({ diaryDataSource }),
      setDiaryDataSourcePreference: (diaryDataSource) =>
        set({
          diaryDataSource,
          diaryLocalExplicit: diaryDataSource === 'local',
        }),

      updatePreferences: (patch) =>
        set((state) => ({
          preferences: mergePreferences(state.preferences, patch),
        })),

      resetToDefaults: () =>
        set(() => {
          applyAppTheme(DEFAULT_THEME, DEFAULT_MODE);
          return {
            theme: DEFAULT_THEME,
            mode: DEFAULT_MODE,
            diaryDataSource: 'local',
            diaryLocalExplicit: false,
            preferences: DEFAULT_PREFERENCES,
          };
        }),
    }),
    {
      name: 'dear-diary-settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        mode: state.mode,
        diaryDataSource: state.diaryDataSource,
        diaryLocalExplicit: state.diaryLocalExplicit,
        preferences: state.preferences,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<{
          theme: AppTheme;
          mode: AppMode;
          diaryDataSource: 'local' | 'cloud';
          diaryLocalExplicit: boolean;
          preferences: DeepPartial<SettingsPreferences>;
        }>;

        return {
          ...currentState,
          theme: persisted.theme ?? currentState.theme,
          mode: persisted.mode ?? currentState.mode,
          diaryDataSource:
            persisted.diaryDataSource ?? currentState.diaryDataSource,
          diaryLocalExplicit:
            persisted.diaryLocalExplicit ?? currentState.diaryLocalExplicit,
          preferences: mergePreferences(
            currentState.preferences,
            persisted.preferences ?? {},
          ),
        };
      },
    },
  ),
);

export const useSettingsStore = shallow(useSettingsStoreBase);

export const getDiaryDataSource = () =>
  useSettingsStoreBase.getState().diaryDataSource;

export const setDiaryDataSource = (source: 'local' | 'cloud') =>
  useSettingsStoreBase.getState().setDiaryDataSource(source);

export const getDiaryLocalExplicit = () =>
  useSettingsStoreBase.getState().diaryLocalExplicit;

export const setDiaryDataSourcePreference = (source: 'local' | 'cloud') =>
  useSettingsStoreBase.getState().setDiaryDataSourcePreference(source);

const { theme, mode } = useSettingsStoreBase.getState();
applyAppTheme(theme, mode);
