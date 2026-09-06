import { useCallback, useState } from 'react';

import type { Message } from '@/store/diary/type';

import { useDiaryStore } from '@/store';

import type { MessageScrollAPI } from './useMessageScroll';

import { getMessagePreviewText } from '../messagePanel.utils';

const writeSystemClipboard = (text: string) => {
  try {
    void navigator.clipboard?.writeText(text).catch(() => undefined);
  } catch {
    // Clipboard access is best-effort; the in-app snapshot remains available.
  }
};

export type MessageActionsAPI = {
  startReply: (messageId: string) => void;
  cancelReply: () => void;
  replyToMessageId: string | null;
  startEdit: (messageId: string) => void;
  cancelEdit: () => void;
  editTargetId: string | null;
  composerDirty: boolean;
  setComposerDirty: (dirty: boolean) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  togglePin: (messageId: string) => void;
  toggleArchive: (messageId: string) => void;
  setTags: (messageId: string, tagIds: string[]) => void;
  requestDelete: (messageId: string) => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
  deleteTargetId: string | null;
  requestForward: (messageId: string) => void;
  confirmForward: (targetChatboxId: string, caption?: string) => void;
  cancelForward: () => void;
  forwardSourceId: string | null;
  copiedMessage: Message | null;
  copyMessage: (messageId: string) => void;
  clearCopiedMessage: () => void;
  pasteCopiedMessage: () => void;
  requestMove: (messageId: string) => void;
  confirmClone: (targetChatboxId: string) => void;
  confirmMove: (targetChatboxId: string) => void;
  cancelMove: () => void;
  moveSourceId: string | null;
  navigateToMessage: (messageId: string) => void;
};

type UseMessageActionsOptions = {
  chatboxId: string;
  scroll: MessageScrollAPI;
  onNavigateToChatbox?: (chatboxId: string, messageId: string) => void;
};

export const useMessageActions = ({
  chatboxId,
  scroll,
  onNavigateToChatbox,
}: UseMessageActionsOptions): MessageActionsAPI => {
  const messages = useDiaryStore('messages');
  const toggleMessagePin = useDiaryStore('toggleMessagePin');
  const toggleMessageArchive = useDiaryStore('toggleMessageArchive');
  const toggleMessageReaction = useDiaryStore('toggleMessageReaction');
  const setMessageTags = useDiaryStore('setMessageTags');
  const deleteMessage = useDiaryStore('deleteMessage');
  const forwardMessage = useDiaryStore('forwardMessage');
  const cloneMessage = useDiaryStore('cloneMessage');
  const createMessage = useDiaryStore('createMessage');
  const moveMessage = useDiaryStore('moveMessage');

  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [composerDirty, setComposerDirty] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [forwardSourceId, setForwardSourceId] = useState<string | null>(null);
  const [moveSourceId, setMoveSourceId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<Message | null>(null);

  const clearSystemClipboard = useCallback(() => {
    writeSystemClipboard('');
  }, []);

  const clearCopiedMessage = useCallback(() => {
    setCopiedMessage(null);
    clearSystemClipboard();
  }, [clearSystemClipboard]);

  const copyMessage = useCallback(
    (messageId: string) => {
      const message = messages[messageId];

      if (!message) {
        return;
      }

      setCopiedMessage(structuredClone(message));
      writeSystemClipboard(getMessagePreviewText(message));
    },
    [messages],
  );

  const pasteCopiedMessage = useCallback(() => {
    if (!copiedMessage) {
      return;
    }

    createMessage({
      chatboxId,
      sender: copiedMessage.sender,
      variant: copiedMessage.variant,
      content: structuredClone(copiedMessage.content),
      tagIds: [...copiedMessage.tagIds],
      pinned: false,
      archived: false,
      replyToMessageId: null,
      sourceMessageId: null,
      reactions: [],
      attachments: structuredClone(copiedMessage.attachments),
      decorators: structuredClone(copiedMessage.decorators),
    } as Partial<Message>);
    setCopiedMessage(null);
    clearSystemClipboard();
  }, [chatboxId, clearSystemClipboard, copiedMessage, createMessage]);

  const navigateToMessage = useCallback(
    (messageId: string) => {
      const target = messages[messageId];

      if (!target) {
        return;
      }

      if (target.chatboxId !== chatboxId) {
        onNavigateToChatbox?.(target.chatboxId, messageId);
        return;
      }

      scroll.scrollToMessage(messageId);
    },
    [chatboxId, messages, onNavigateToChatbox, scroll],
  );

  const startReply = useCallback((messageId: string) => {
    setReplyToMessageId(messageId);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyToMessageId(null);
  }, []);

  const startEdit = useCallback(
    (messageId: string) => {
      const message = messages[messageId];
      setReplyToMessageId(message?.replyToMessageId ?? null);
      setEditTargetId(messageId);
    },
    [messages],
  );

  const cancelEdit = useCallback(() => {
    setEditTargetId(null);
    setReplyToMessageId(null);
  }, []);

  return {
    replyToMessageId,
    editTargetId,
    composerDirty,
    setComposerDirty,
    deleteTargetId,
    forwardSourceId,
    copiedMessage,
    moveSourceId,
    startReply,
    cancelReply,
    startEdit,
    cancelEdit,
    toggleReaction: toggleMessageReaction,
    togglePin: toggleMessagePin,
    toggleArchive: toggleMessageArchive,
    setTags: setMessageTags,
    requestDelete: setDeleteTargetId,
    confirmDelete: () => {
      if (deleteTargetId) {
        deleteMessage(deleteTargetId);
      }

      setDeleteTargetId(null);
    },
    cancelDelete: () => setDeleteTargetId(null),
    requestForward: setForwardSourceId,
    confirmForward: (targetChatboxId, caption) => {
      if (forwardSourceId) {
        forwardMessage(forwardSourceId, targetChatboxId, caption);
      }

      setForwardSourceId(null);
    },
    cancelForward: () => setForwardSourceId(null),
    copyMessage,
    clearCopiedMessage,
    pasteCopiedMessage,
    requestMove: setMoveSourceId,
    confirmClone: (targetChatboxId) => {
      if (moveSourceId) {
        cloneMessage(moveSourceId, targetChatboxId);
      }

      setMoveSourceId(null);
    },
    confirmMove: (targetChatboxId) => {
      if (moveSourceId) {
        moveMessage(moveSourceId, targetChatboxId);

        if (replyToMessageId === moveSourceId) {
          setReplyToMessageId(null);
        }

        if (editTargetId === moveSourceId) {
          setEditTargetId(null);
          setReplyToMessageId(null);
        }
      }

      setMoveSourceId(null);
    },
    cancelMove: () => setMoveSourceId(null),
    navigateToMessage,
  };
};
