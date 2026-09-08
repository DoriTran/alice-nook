import { useCallback, useLayoutEffect, useRef } from 'react';

export const useMessageScroll = (chatboxId?: string) => {
  const refs = useRef(new Map<string, HTMLElement>());
  const feedRef = useRef<HTMLDivElement | null>(null);
  const offsetsRef = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (chatboxId && feedRef.current && offsetsRef.current.has(chatboxId)) {
        feedRef.current.scrollTop = offsetsRef.current.get(chatboxId) ?? 0;
      }
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (chatboxId && feedRef.current) {
        offsetsRef.current.set(chatboxId, feedRef.current.scrollTop);
      }
    };
  }, [chatboxId]);

  const registerRef = useCallback(
    (messageId: string, element: HTMLElement | null) => {
      if (element) {
        refs.current.set(messageId, element);
        return;
      }

      refs.current.delete(messageId);
    },
    [],
  );

  const scrollToMessage = useCallback((messageId: string) => {
    const element = refs.current.get(messageId);

    if (!element) {
      return false;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.dataset.highlighted = 'true';
    window.setTimeout(() => {
      delete element.dataset.highlighted;
    }, 1500);

    return true;
  }, []);

  const scrollToBottom = useCallback(() => {
    const feed = feedRef.current;

    if (!feed) {
      return false;
    }

    // column-reverse: scrollTop 0 is the visual bottom
    feed.scrollTop = 0;
    return true;
  }, []);

  return {
    feedRef,
    registerRef,
    scrollToMessage,
    scrollToBottom,
  };
};

export type MessageScrollAPI = ReturnType<typeof useMessageScroll>;
