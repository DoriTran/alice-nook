import { create } from 'zustand';

import type { UploadRuntime } from './cloudAttachmentUpload';
import type { CloudMessagePayload, DiaryStore } from './type';

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

export type MessageSyncStatus = 'pending' | 'failed';
export type { CloudMessagePayload } from './type';
export type MessageSyncEntry = {
  status: MessageSyncStatus;
  payload: CloudMessagePayload;
  attempt: number;
  runtime: UploadRuntime;
};

type CloudMessageSyncStore = {
  entries: Record<string, MessageSyncEntry>;
};

export const useCloudMessageSyncStore = create<CloudMessageSyncStore>()(() => ({
  entries: {},
}));

export const setCloudMessageSyncEntry = (
  messageId: string,
  entry: MessageSyncEntry | null,
) =>
  useCloudMessageSyncStore.setState((state) => {
    if (entry) {
      return { entries: { ...state.entries, [messageId]: entry } };
    }
    const { [messageId]: _removed, ...entries } = state.entries;
    return { entries };
  });

export const getCloudMessageSyncEntry = (messageId: string) =>
  useCloudMessageSyncStore.getState().entries[messageId];

export const clearCloudMessageSync = () =>
  useCloudMessageSyncStore.setState((state) => {
    Object.values(state.entries).forEach((entry) => {
      entry.runtime.controller.abort();
      entry.runtime.previewUrls.forEach((url) => URL.revokeObjectURL(url));
    });
    return { entries: {} };
  });
