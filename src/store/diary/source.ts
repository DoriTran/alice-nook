import { useEffect } from 'react';
import { create } from 'zustand';

import type { DiaryDataSource } from '@/store/settings/type';

import { ApiError, diaryApi } from '@/api';
import { mapDiarySnapshot } from '@/api/diary/mapper';
import {
  getDiaryDataSource,
  getDiaryLocalExplicit,
  setDiaryDataSource,
  setDiaryDataSourcePreference,
  useSettingsStore,
} from '@/store/settings/store';

import { clearCloudDiary, replaceCloudDiary } from './cloudStore';

export type DiaryCloudStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'auth-required'
  | 'error';

type DiarySourceRuntime = {
  cloudStatus: DiaryCloudStatus;
  error: string | null;
  mutationCount: number;
};

export const useDiarySourceRuntime = create<DiarySourceRuntime>()(() => ({
  cloudStatus: 'idle',
  error: null,
  mutationCount: 0,
}));

let requestGeneration = 0;
let hydrationController: AbortController | null = null;
let activeUserId: string | null = null;
let sessionInitialized = false;

const setRuntime = (
  patch:
    | Partial<DiarySourceRuntime>
    | ((state: DiarySourceRuntime) => Partial<DiarySourceRuntime>),
) => useDiarySourceRuntime.setState(patch);

const isCurrentCloudRequest = (generation: number, userId: string) =>
  generation === requestGeneration &&
  getDiaryDataSource() === 'cloud' &&
  activeUserId === userId;

const applyCloudError = (error: unknown, hydration = false) => {
  if (error instanceof DOMException && error.name === 'AbortError') return;
  if (error instanceof ApiError && error.status === 401) {
    setRuntime({ cloudStatus: 'auth-required', error: error.message });
    return;
  }
  setRuntime({
    ...(hydration ? { cloudStatus: 'error' as const } : {}),
    error:
      error instanceof Error
        ? error.message
        : 'Cloud Diary could not be loaded.',
  });
};

export const setDiarySessionUser = (userId: string | null) => {
  if (sessionInitialized && activeUserId === userId) {
    if (getDiaryDataSource() === 'cloud' && !userId) {
      setRuntime({ cloudStatus: 'auth-required', error: null });
    }
    return;
  }
  sessionInitialized = true;
  activeUserId = userId;
  requestGeneration += 1;
  hydrationController?.abort();
  hydrationController = null;
  clearCloudDiary();

  const nextSource: DiaryDataSource = userId
    ? getDiaryLocalExplicit()
      ? 'local'
      : 'cloud'
    : 'local';
  setDiaryDataSource(nextSource);
  setRuntime({ cloudStatus: 'idle', error: null });
};

export const hydrateCloudDiary = async (): Promise<void> => {
  if (getDiaryDataSource() !== 'cloud') return;
  if (!activeUserId) {
    setRuntime({ cloudStatus: 'auth-required', error: null });
    return;
  }

  const userId = activeUserId;
  const generation = ++requestGeneration;
  hydrationController?.abort();
  const controller = new AbortController();
  hydrationController = controller;
  setRuntime({ cloudStatus: 'loading', error: null });

  try {
    const response = await diaryApi.getSnapshot(controller.signal);
    if (!isCurrentCloudRequest(generation, userId)) return;
    replaceCloudDiary(mapDiarySnapshot(response));
    setRuntime({ cloudStatus: 'ready', error: null });
  } catch (error) {
    if (!isCurrentCloudRequest(generation, userId)) return;
    applyCloudError(error, true);
  } finally {
    if (hydrationController === controller) hydrationController = null;
  }
};

export const reconcileCloudDiary = async (): Promise<void> => {
  if (!activeUserId || getDiaryDataSource() !== 'cloud') return;
  const userId = activeUserId;
  const generation = requestGeneration;
  const response = await diaryApi.getSnapshot();
  if (isCurrentCloudRequest(generation, userId)) {
    replaceCloudDiary(mapDiarySnapshot(response));
  }
};

export const switchDiaryDataSource = async (
  source: DiaryDataSource,
): Promise<void> => {
  requestGeneration += 1;
  hydrationController?.abort();
  hydrationController = null;
  setDiaryDataSourcePreference(source);

  if (source === 'local') {
    setRuntime({ cloudStatus: 'idle', error: null });
    return;
  }
  await hydrateCloudDiary();
};

export const runCloudMutation = async <T>(
  mutation: () => Promise<T>,
): Promise<T> => {
  if (!activeUserId) {
    setRuntime({ cloudStatus: 'auth-required', error: null });
    throw new ApiError('Sign in to use Cloud Diary.', { status: 401 });
  }
  if (getDiaryDataSource() !== 'cloud') {
    throw new ApiError('The Diary data source changed before this action ran.');
  }

  const generation = requestGeneration;
  const userId = activeUserId;
  setRuntime((state) => ({ mutationCount: state.mutationCount + 1 }));
  try {
    const result = await mutation();
    if (!isCurrentCloudRequest(generation, userId)) {
      throw new ApiError(
        'The Diary data source changed before this action finished.',
      );
    }
    return result;
  } catch (error) {
    if (isCurrentCloudRequest(generation, userId)) applyCloudError(error);
    throw error;
  } finally {
    setRuntime((state) => ({
      mutationCount: Math.max(0, state.mutationCount - 1),
    }));
  }
};

export const getActiveDiaryUserId = () => activeUserId;

export const useDiarySourceLifecycle = (userId: string | null | undefined) => {
  const source = useSettingsStore('diaryDataSource');

  useEffect(() => {
    if (userId === undefined) return;
    setDiarySessionUser(userId);
    if (source === 'cloud' && userId) void hydrateCloudDiary();
  }, [source, userId]);
};
