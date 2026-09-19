import { useEffect } from 'react';
import { create } from 'zustand';

import type { TimerReconciliationResponse } from '@/api/diary/types';
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

import {
  clearCloudDiary,
  clearCloudMessageSync,
  getCloudDiaryState,
  getCloudMessageSyncEntry,
  replaceCloudDiary,
  updateCloudDiary,
} from './cloudStore';

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
let timerReconcilePromise: Promise<TimerReconciliationResponse | null> | null =
  null;
let timerReconcileGeneration = -1;
const rangTimerKeys = new Set<string>();

export const timerRingKey = (
  messageId: string,
  decoratorIndex: number,
  deadlineAt: string,
) => `${messageId}:${decoratorIndex}:${deadlineAt}`;

export const markCloudTimerRang = (key: string): boolean => {
  if (rangTimerKeys.has(key)) return false;
  rangTimerKeys.add(key);
  return true;
};

const applyTimerReconciliation = (result: TimerReconciliationResponse) => {
  if (result.affectedMessages.length === 0) return;
  const ringingIds = new Set(result.ringingChatboxIds);

  updateCloudDiary((state) => {
    const messages = { ...state.messages };
    const chatboxes = { ...state.chatboxes };
    const newlyRinging = new Set<string>();

    for (const affected of result.affectedMessages) {
      const current = messages[affected.messageId];
      if (!current || current.chatboxId !== affected.chatboxId) continue;
      const decorators = [...current.decorators];
      for (const timer of affected.processedTimers) {
        const existing = decorators[timer.decoratorIndex];
        const updated = affected.decorators[timer.decoratorIndex];
        if (
          existing?.type !== 'timer' ||
          updated?.type !== 'timer' ||
          existing.deadlineAt !== timer.deadlineAt
        ) {
          continue;
        }
        decorators[timer.decoratorIndex] = updated;
        const key = timerRingKey(
          affected.messageId,
          timer.decoratorIndex,
          timer.deadlineAt,
        );
        if (ringingIds.has(affected.chatboxId) && markCloudTimerRang(key)) {
          newlyRinging.add(affected.chatboxId);
        }
      }
      messages[affected.messageId] = { ...current, decorators };
    }

    for (const chatboxId of newlyRinging) {
      const current = chatboxes[chatboxId];
      if (current?.notificationEnabled) {
        chatboxes[chatboxId] = { ...current, notificationRinging: true };
      }
    }

    return { ...state, messages, chatboxes };
  });
};

const refreshUnconfirmedTimers = async (generation: number, userId: string) => {
  const now = Date.now();
  const staleIds = Object.values(getCloudDiaryState().messages)
    .filter(
      (message) =>
        !getCloudMessageSyncEntry(message.id) &&
        message.decorators.some(
          (timer) =>
            timer.type === 'timer' &&
            timer.mode !== 'countup' &&
            !!timer.deadlineAt &&
            !timer.alertedAt &&
            Number.isFinite(Date.parse(timer.deadlineAt)) &&
            Date.parse(timer.deadlineAt) <= now,
        ),
    )
    .map((message) => message.id);

  await Promise.allSettled(
    staleIds.map(async (id) => {
      const serverMessage = await diaryApi.getMessage(id);
      if (!isCurrentCloudRequest(generation, userId)) return;
      updateCloudDiary((state) => {
        const current = state.messages[id];
        if (!current || current.chatboxId !== serverMessage.chatboxId) {
          return state;
        }
        let changed = false;
        const decorators = current.decorators.map((decorator, index) => {
          const serverTimer = serverMessage.decorators[index];
          if (
            decorator.type === 'timer' &&
            serverTimer?.type === 'timer' &&
            decorator.deadlineAt === serverTimer.deadlineAt &&
            serverTimer.alertedAt &&
            !decorator.alertedAt
          ) {
            changed = true;
            return serverTimer;
          }
          return decorator;
        });
        if (!changed) return state;
        return {
          ...state,
          messages: {
            ...state.messages,
            [id]: { ...current, decorators },
          },
        };
      });
    }),
  );
};

export const reconcileCloudTimers =
  (): Promise<TimerReconciliationResponse | null> => {
    if (!activeUserId || getDiaryDataSource() !== 'cloud') {
      return Promise.resolve(null);
    }
    if (
      timerReconcilePromise &&
      timerReconcileGeneration === requestGeneration
    ) {
      return timerReconcilePromise;
    }

    const generation = requestGeneration;
    const userId = activeUserId;
    timerReconcileGeneration = generation;
    const request = diaryApi
      .reconcileTimers()
      .then((result) => {
        if (!isCurrentCloudRequest(generation, userId)) return null;
        applyTimerReconciliation(result);
        return refreshUnconfirmedTimers(generation, userId).then(() => result);
      })
      .catch((error: unknown) => {
        if (
          isCurrentCloudRequest(generation, userId) &&
          error instanceof ApiError &&
          error.status === 401
        ) {
          applyCloudError(error);
        }
        throw error;
      });
    timerReconcilePromise = request.finally(() => {
      if (timerReconcileGeneration === generation) timerReconcilePromise = null;
    });
    return timerReconcilePromise;
  };

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
  clearCloudMessageSync();
  rangTimerKeys.clear();

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
    try {
      await reconcileCloudTimers();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) throw error;
      if (isCurrentCloudRequest(generation, userId)) applyCloudError(error);
    }
    if (!isCurrentCloudRequest(generation, userId)) return;
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
    clearCloudMessageSync();
    rangTimerKeys.clear();
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
