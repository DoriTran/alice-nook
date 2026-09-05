import { useEffect } from 'react';

import { useDiaryStore } from '@/store';

const MAX_TIMEOUT_MS = 2_147_483_647;

export const useTimerNotificationCoordinator = (enabled: boolean): void => {
  const messages = useDiaryStore('messages');
  const patchMessage = useDiaryStore('patchMessage');
  const updateChatbox = useDiaryStore('updateChatbox');

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let timeoutId: number | undefined;

    const checkDeadlines = () => {
      const now = Date.now();
      const alertedAt = new Date(now).toISOString();
      let nearestDeadline = Number.POSITIVE_INFINITY;
      const ringingChatboxIds = new Set<string>();

      Object.values(messages).forEach((message) => {
        let changed = false;
        const decorators = message.decorators.map((decorator) => {
          if (
            decorator.type !== 'timer' ||
            decorator.mode === 'countup' ||
            !decorator.deadlineAt ||
            decorator.alertedAt
          ) {
            return decorator;
          }

          const deadline = new Date(decorator.deadlineAt).getTime();
          if (!Number.isFinite(deadline)) {
            return decorator;
          }

          if (deadline > now) {
            nearestDeadline = Math.min(nearestDeadline, deadline);
            return decorator;
          }

          changed = true;
          ringingChatboxIds.add(message.chatboxId);
          return { ...decorator, alertedAt };
        });

        if (changed) {
          patchMessage(message.id, { decorators });
        }
      });

      ringingChatboxIds.forEach((chatboxId) => {
        updateChatbox(chatboxId, { notificationRinging: true });
      });

      if (Number.isFinite(nearestDeadline)) {
        timeoutId = window.setTimeout(
          checkDeadlines,
          Math.min(
            Math.max(0, nearestDeadline - Date.now() + 50),
            MAX_TIMEOUT_MS,
          ),
        );
      }
    };

    const handlePageActivity = () => {
      if (document.visibilityState === 'visible') {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
        checkDeadlines();
      }
    };

    checkDeadlines();
    window.addEventListener('focus', handlePageActivity);
    document.addEventListener('visibilitychange', handlePageActivity);

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      window.removeEventListener('focus', handlePageActivity);
      document.removeEventListener('visibilitychange', handlePageActivity);
    };
  }, [enabled, messages, patchMessage, updateChatbox]);
};
