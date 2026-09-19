import { useEffect, useRef } from 'react';

import { useDiaryStore } from '@/store';
import {
  updateCloudDiary,
  useCloudMessageSyncStore,
} from '@/store/diary/cloudStore';
import {
  markCloudTimerRang,
  reconcileCloudTimers,
  timerRingKey,
} from '@/store/diary/source';
import { getDiaryDataSource, useSettingsStore } from '@/store/settings/store';

const MAX_TIMEOUT_MS = 2_147_483_647;
const RETRY_MS = 5000;

export const useTimerNotificationCoordinator = (enabled: boolean): void => {
  const messages = useDiaryStore('messages');
  const chatboxes = useDiaryStore('chatboxes');
  const patchMessage = useDiaryStore('patchMessage');
  const updateChatbox = useDiaryStore('updateChatbox');
  const source = useSettingsStore('diaryDataSource');
  const syncEntries = useCloudMessageSyncStore((state) => state.entries);
  const localInFlight = useRef(new Set<string>());
  const cloudInFlight = useRef(false);
  const foregroundInFlight = useRef(false);
  const lastForegroundAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    let timeoutId: number | undefined;
    let disposed = false;

    const checkDeadlines = (allowCloudRequest = true) => {
      if (disposed) return;
      if (getDiaryDataSource() !== source) return;
      if (source === 'cloud' && document.visibilityState !== 'visible') return;
      if (source === 'cloud' && foregroundInFlight.current) return;

      const now = Date.now();
      const alertedAt = new Date(now).toISOString();
      let nearestDeadline = Number.POSITIVE_INFINITY;
      let needsRetry = false;
      const cloudExpired = new Map<
        string,
        (typeof messages)[string]['decorators']
      >();
      const cloudRinging = new Set<string>();

      Object.values(messages).forEach((message) => {
        if (source === 'cloud' && syncEntries[message.id]) return;
        if (source === 'local' && localInFlight.current.has(message.id)) {
          needsRetry = true;
          return;
        }

        let changed = false;
        let visualChanged = false;
        const decorators = message.decorators.map((decorator, index) => {
          if (
            decorator.type !== 'timer' ||
            decorator.mode === 'countup' ||
            !decorator.deadlineAt ||
            decorator.alertedAt
          ) {
            return decorator;
          }
          const deadline = Date.parse(decorator.deadlineAt);
          if (!Number.isFinite(deadline)) return decorator;
          if (deadline > now) {
            nearestDeadline = Math.min(nearestDeadline, deadline);
            return decorator;
          }

          changed = true;
          if (source === 'cloud') {
            visualChanged ||=
              decorator.running ||
              !decorator.pause ||
              decorator.durationMs !== 0;
            const key = timerRingKey(message.id, index, decorator.deadlineAt);
            if (
              markCloudTimerRang(key) &&
              chatboxes[message.chatboxId]?.notificationEnabled
            ) {
              cloudRinging.add(message.chatboxId);
            }
          }
          return {
            ...decorator,
            running: false,
            pause: true,
            durationMs: 0,
            ...(source === 'local' ? { alertedAt } : {}),
          };
        });

        if (!changed) return;
        needsRetry = true;
        if (source === 'cloud') {
          if (visualChanged) cloudExpired.set(message.id, decorators);
          return;
        }

        localInFlight.current.add(message.id);
        void patchMessage(message.id, { decorators })
          .then(() => {
            if (
              getDiaryDataSource() === 'local' &&
              chatboxes[message.chatboxId]?.notificationEnabled
            ) {
              return updateChatbox(message.chatboxId, {
                notificationRinging: true,
              });
            }
          })
          .catch(() => undefined)
          .finally(() => localInFlight.current.delete(message.id));
      });

      if (cloudExpired.size > 0 || cloudRinging.size > 0) {
        updateCloudDiary((state) => {
          const nextMessages = { ...state.messages };
          const nextChatboxes = { ...state.chatboxes };
          for (const [id, decorators] of cloudExpired) {
            const current = nextMessages[id];
            if (current) nextMessages[id] = { ...current, decorators };
          }
          for (const id of cloudRinging) {
            const current = nextChatboxes[id];
            if (current?.notificationEnabled) {
              nextChatboxes[id] = { ...current, notificationRinging: true };
            }
          }
          return { ...state, messages: nextMessages, chatboxes: nextChatboxes };
        });
      }

      if (
        source === 'cloud' &&
        needsRetry &&
        allowCloudRequest &&
        !cloudInFlight.current
      ) {
        cloudInFlight.current = true;
        void reconcileCloudTimers()
          .catch(() => undefined)
          .finally(() => {
            cloudInFlight.current = false;
          });
      }

      if (Number.isFinite(nearestDeadline) || needsRetry) {
        timeoutId = window.setTimeout(
          checkDeadlines,
          Math.min(
            Number.isFinite(nearestDeadline)
              ? Math.max(0, nearestDeadline - Date.now() + 50)
              : MAX_TIMEOUT_MS,
            needsRetry ? RETRY_MS : MAX_TIMEOUT_MS,
          ),
        );
      }
    };

    const handlePageActivity = () => {
      if (disposed) return;
      if (getDiaryDataSource() !== source) return;
      if (document.visibilityState !== 'visible') {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        return;
      }
      if (source === 'local') {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
        checkDeadlines();
        return;
      }
      if (
        foregroundInFlight.current ||
        Date.now() - lastForegroundAt.current < 500
      ) {
        return;
      }
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      lastForegroundAt.current = Date.now();
      foregroundInFlight.current = true;
      void reconcileCloudTimers()
        .then(() => {
          foregroundInFlight.current = false;
          checkDeadlines();
        })
        .catch(() => {
          foregroundInFlight.current = false;
          checkDeadlines(false);
        });
    };

    checkDeadlines();
    window.addEventListener('focus', handlePageActivity);
    document.addEventListener('visibilitychange', handlePageActivity);

    return () => {
      disposed = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      window.removeEventListener('focus', handlePageActivity);
      document.removeEventListener('visibilitychange', handlePageActivity);
    };
  }, [
    enabled,
    messages,
    chatboxes,
    patchMessage,
    source,
    syncEntries,
    updateChatbox,
  ]);
};
