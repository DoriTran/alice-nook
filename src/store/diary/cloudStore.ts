import { create } from 'zustand';

import type { DiaryStore } from './type';

import { diaryInitialState } from './constants';

type CloudDiaryStore = DiaryStore & {
  replaceSnapshot: (snapshot: DiaryStore) => void;
  updateSnapshot: (updater: (state: DiaryStore) => DiaryStore) => void;
  clearSnapshot: () => void;
};

export const useCloudDiaryStoreBase = create<CloudDiaryStore>()((set) => ({
  ...diaryInitialState,
  replaceSnapshot: (snapshot) => set(snapshot),
  updateSnapshot: (updater) => set((state) => updater(state)),
  clearSnapshot: () => set(diaryInitialState),
}));

export const getCloudDiaryState = () => useCloudDiaryStoreBase.getState();

export const replaceCloudDiary = (snapshot: DiaryStore) =>
  useCloudDiaryStoreBase.getState().replaceSnapshot(snapshot);

export const updateCloudDiary = (
  updater: (snapshot: DiaryStore) => DiaryStore,
) => useCloudDiaryStoreBase.getState().updateSnapshot(updater);

export const clearCloudDiary = () =>
  useCloudDiaryStoreBase.getState().clearSnapshot();
