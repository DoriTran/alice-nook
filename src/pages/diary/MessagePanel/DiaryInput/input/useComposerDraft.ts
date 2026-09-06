import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from 'react';
import { v4 as uuidv4 } from 'uuid';

import type { RichTextContent } from '@/packages/base/AdRichText/types';
import type { MessageDecorator, MessageVariant } from '@/store/diary/type';

import { generateAiResponse, uploadAttachment } from '@/api';
import { migratePlainTextToRichText } from '@/packages/base/AdRichText/richtext';
import { useDiaryStore } from '@/store';

import { syncLinkAttachments } from '../attachment/linkAttachments.utils';
import {
  createInitialDraft,
  createEmptyTodoItem,
  type ComposerDraft,
  type ComposerEditorRef,
  type DraftTodoItem,
  type PendingVariantSwitch,
} from './composer.types';
import {
  buildDraftFromMessage,
  buildMessagePayload,
  convertDraftToVariant,
  createTempAttachment,
  createTimerDecorator,
  createTicketDecorator,
  draftHasVariantContent,
  fileToAttachmentType,
  hasDraftContent,
} from './composer.utils';

export const useComposerDraft = (
  chatboxId: string,
  options?: {
    replyToMessageId?: string | null;
    onReplyClear?: () => void;
    editMessageId?: string | null;
    onEditClear?: () => void;
    onDirtyChange?: (dirty: boolean) => void;
  },
) => {
  const createMessage = useDiaryStore('createMessage');
  const updateMessage = useDiaryStore('updateMessage');
  const messages = useDiaryStore('messages');
  const initialDraftsRef = useRef<Record<string, ComposerDraft>>({});
  const [drafts, setDrafts] = useState<Record<string, ComposerDraft>>({});
  const draft =
    drafts[chatboxId] ??
    (initialDraftsRef.current[chatboxId] ??= createInitialDraft());
  const setDraft = useCallback(
    (action: SetStateAction<ComposerDraft>) => {
      setDrafts((current) => {
        const currentDraft =
          current[chatboxId] ??
          (initialDraftsRef.current[chatboxId] ??= createInitialDraft());
        const nextDraft =
          typeof action === 'function' ? action(currentDraft) : action;

        return {
          ...current,
          [chatboxId]: nextDraft,
        };
      });
    },
    [chatboxId],
  );
  const [pendingVariantSwitch, setPendingVariantSwitch] =
    useState<PendingVariantSwitch>(null);
  const [sending, setSending] = useState(false);
  const editorRef = useRef<ComposerEditorRef | null>(null);
  const editMessageId = options?.editMessageId ?? null;
  const prevEditMessageIdRef = useRef<string | null>(editMessageId);
  const onDirtyChangeRef = useRef(options?.onDirtyChange);
  const onEditClearRef = useRef(options?.onEditClear);
  const onReplyClearRef = useRef(options?.onReplyClear);

  onDirtyChangeRef.current = options?.onDirtyChange;
  onEditClearRef.current = options?.onEditClear;
  onReplyClearRef.current = options?.onReplyClear;

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      replyToMessageId: options?.replyToMessageId ?? null,
    }));
  }, [options?.replyToMessageId, setDraft]);

  useEffect(() => {
    const previous = prevEditMessageIdRef.current;
    prevEditMessageIdRef.current = editMessageId;

    if (editMessageId) {
      const message = messages[editMessageId];

      if (message && editMessageId !== previous) {
        setDraft(buildDraftFromMessage(message));
      }

      return;
    }

    if (previous) {
      setDraft(createInitialDraft());
    }
    // Only re-hydrate when entering/leaving edit mode, not on every messages update.
  }, [editMessageId, setDraft]);

  useEffect(() => {
    if (editMessageId) {
      onDirtyChangeRef.current?.(false);
      return;
    }

    onDirtyChangeRef.current?.(hasDraftContent(draft));
  }, [draft, editMessageId]);

  const setFocused = useCallback(
    (focused: boolean) => {
      setDraft((current) => ({ ...current, focused }));
    },
    [setDraft],
  );

  const setContent = useCallback(
    (content: RichTextContent) => {
      setDraft((current) => ({
        ...current,
        content,
        attachments: syncLinkAttachments(content.preview, current.attachments),
      }));
    },
    [setDraft],
  );

  const clearAll = useCallback(() => {
    setDraft(createInitialDraft());
  }, [setDraft]);

  const cancelEdit = useCallback(() => {
    setDraft(createInitialDraft());
    onEditClearRef.current?.();
  }, [setDraft]);

  const applyVariantSwitch = useCallback(
    (nextVariant: MessageVariant) => {
      setDraft((current) => ({
        ...current,
        ...convertDraftToVariant(current, nextVariant),
      }));
      setPendingVariantSwitch(null);
    },
    [setDraft],
  );

  const requestVariantSwitch = useCallback(
    (nextVariant: MessageVariant) => {
      if (nextVariant === draft.variant && nextVariant !== 'text') {
        applyVariantSwitch('text');
        return;
      }

      if (nextVariant === draft.variant) {
        return;
      }

      if (draftHasVariantContent(draft)) {
        setPendingVariantSwitch({ nextVariant });
        return;
      }

      applyVariantSwitch(nextVariant);
    },
    [applyVariantSwitch, draft],
  );

  const toggleDecorator = useCallback(
    (type: MessageDecorator['type']) => {
      setDraft((current) => {
        const exists = current.decorators.some(
          (decoration) => decoration.type === type,
        );

        if (exists) {
          return {
            ...current,
            decorators: current.decorators.filter(
              (decoration) => decoration.type !== type,
            ),
          };
        }

        const decoration =
          type === 'ticket' ? createTicketDecorator() : createTimerDecorator();

        return {
          ...current,
          decorators: [...current.decorators, decoration],
        };
      });
    },
    [setDraft],
  );

  const updateDecorator = useCallback(
    (index: number, decoration: MessageDecorator) => {
      setDraft((current) => ({
        ...current,
        decorators: current.decorators.map((item, itemIndex) =>
          itemIndex === index ? decoration : item,
        ),
      }));
    },
    [setDraft],
  );

  const removeAttachment = useCallback(
    (attachmentId: string) => {
      setDraft((current) => ({
        ...current,
        attachments: current.attachments.filter(
          (attachment) => attachment.id !== attachmentId,
        ),
      }));
    },
    [setDraft],
  );

  const addFiles = useCallback(
    async (files: FileList | File[], kind: 'file' | 'image' | 'video') => {
      const fileList = Array.from(files);

      for (const file of fileList) {
        const blobUrl = URL.createObjectURL(file);
        const attachmentType = fileToAttachmentType(file, kind);
        const tempId = `att:${uuidv4()}`;
        const tempAttachment = createTempAttachment(
          file,
          attachmentType,
          tempId,
          blobUrl,
        );

        setDraft((current) => ({
          ...current,
          attachments: [...current.attachments, tempAttachment],
        }));

        try {
          const result = await uploadAttachment(file);
          URL.revokeObjectURL(blobUrl);

          setDraft((current) => ({
            ...current,
            attachments: current.attachments.map((attachment) =>
              attachment.id === tempId
                ? attachment.type === 'image' || attachment.type === 'video'
                  ? {
                      ...attachment,
                      url: result.url,
                      name: result.name,
                    }
                  : {
                      ...attachment,
                      url: result.url,
                      name: result.name,
                      mimeType: result.mimeType,
                      size: result.size,
                    }
                : attachment,
            ),
          }));
        } catch {
          // Keep blob URL as fallback
        }
      }
    },
    [setDraft],
  );

  const addTodoRow = useCallback(() => {
    setDraft((current) => ({
      ...current,
      todoItems: [...current.todoItems, createEmptyTodoItem()],
    }));
  }, [setDraft]);

  const updateTodoItem = useCallback(
    (itemId: string, patch: Partial<DraftTodoItem>) => {
      setDraft((current) => ({
        ...current,
        todoItems: current.todoItems.map((item) => {
          if (item.id !== itemId) {
            return item;
          }

          const nextItem = { ...item, ...patch };

          if (patch.text !== undefined) {
            nextItem.attachments = syncLinkAttachments(
              nextItem.text,
              nextItem.attachments,
            );
          }

          return nextItem;
        }),
      }));
    },
    [setDraft],
  );

  const removeTodoRow = useCallback(
    (itemId: string) => {
      setDraft((current) => {
        const nextItems = current.todoItems.filter(
          (item) => item.id !== itemId,
        );
        return {
          ...current,
          todoItems: nextItems.length > 0 ? nextItems : [createEmptyTodoItem()],
        };
      });
    },
    [setDraft],
  );

  const reorderTodoRow = useCallback(
    (current: number, previous: number) => {
      if (current === previous) {
        return;
      }

      setDraft((draftState) => {
        const items = draftState.todoItems;
        if (
          current < 0 ||
          previous < 0 ||
          current >= items.length ||
          previous >= items.length
        ) {
          return draftState;
        }

        const next = items.slice();
        [next[current], next[previous]] = [next[previous], next[current]];
        return { ...draftState, todoItems: next };
      });
    },
    [setDraft],
  );

  const addTodoRowFiles = useCallback(
    async (itemId: string, files: FileList | File[]) => {
      const fileList = Array.from(files);

      for (const file of fileList) {
        const blobUrl = URL.createObjectURL(file);
        const attachmentType = fileToAttachmentType(file, 'file');
        const tempId = `att:${uuidv4()}`;
        const tempAttachment = createTempAttachment(
          file,
          attachmentType,
          tempId,
          blobUrl,
        );

        setDraft((current) => ({
          ...current,
          todoItems: current.todoItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  attachments: [...item.attachments, tempAttachment],
                }
              : item,
          ),
        }));

        try {
          const result = await uploadAttachment(file);
          URL.revokeObjectURL(blobUrl);

          setDraft((current) => ({
            ...current,
            todoItems: current.todoItems.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    attachments: item.attachments.map((attachment) =>
                      attachment.id === tempId
                        ? attachment.type === 'image' ||
                          attachment.type === 'video'
                          ? {
                              ...attachment,
                              url: result.url,
                              name: result.name,
                            }
                          : {
                              ...attachment,
                              url: result.url,
                              name: result.name,
                              mimeType: result.mimeType,
                              size: result.size,
                            }
                        : attachment,
                    ),
                  }
                : item,
            ),
          }));
        } catch {
          // Keep blob URL
        }
      }
    },
    [setDraft],
  );

  const removeTodoRowAttachment = useCallback(
    (itemId: string, attachmentId: string) => {
      setDraft((current) => ({
        ...current,
        todoItems: current.todoItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                attachments: item.attachments.filter(
                  (attachment) => attachment.id !== attachmentId,
                ),
              }
            : item,
        ),
      }));
    },
    [setDraft],
  );

  const send = useCallback(async () => {
    const payload = buildMessagePayload(draft, chatboxId);

    if (!payload || sending) {
      return;
    }

    setSending(true);

    try {
      if (editMessageId) {
        const current = messages[editMessageId];

        updateMessage(editMessageId, {
          variant: payload.variant,
          content: payload.content,
          attachments: payload.attachments ?? [],
          decorators: payload.decorators ?? [],
          replyToMessageId:
            payload.replyToMessageId ?? current?.replyToMessageId ?? null,
        });

        setDraft(createInitialDraft());
        onEditClearRef.current?.();
        return;
      }

      const prompt =
        payload.variant === 'ai' &&
        payload.content &&
        'preview' in payload.content
          ? payload.content.preview
          : '';

      createMessage(payload);

      if (payload.variant === 'ai' && prompt) {
        const response = await generateAiResponse({ chatboxId, prompt });

        createMessage({
          chatboxId,
          sender: 'assistant',
          variant: 'text',
          content: migratePlainTextToRichText(
            response.list
              ? `${response.text}\n\n${response.list.map((item) => `• ${item}`).join('\n')}`
              : response.text,
          ),
          attachments: [],
          decorators: [],
          tagIds: [],
          pinned: false,
          archived: false,
          replyToMessageId: null,
          sourceMessageId: null,
          reactions: [],
        });
      }

      setDraft(createInitialDraft());
      onReplyClearRef.current?.();
    } finally {
      setSending(false);
    }
  }, [
    chatboxId,
    createMessage,
    draft,
    editMessageId,
    messages,
    sending,
    updateMessage,
  ]);

  const insertReactionIcon = useCallback(
    (icon: string) => {
      if (editorRef.current) {
        editorRef.current.insertAtCursor(icon);
        return;
      }

      // Fallback if the editor ref isn't mounted yet — still apply the glyph.
      setDraft((current) => ({
        ...current,
        content: migratePlainTextToRichText(
          `${current.content.preview}${icon}`,
        ),
      }));
    },
    [setDraft],
  );

  const updateDraft = useCallback(
    (updater: (draft: ComposerDraft) => ComposerDraft) => {
      setDraft(updater);
    },
    [setDraft],
  );

  return {
    draft,
    editorRef,
    sending,
    isEditing: editMessageId !== null,
    pendingVariantSwitch,
    setFocused,
    setContent,
    clearAll,
    cancelEdit,
    requestVariantSwitch,
    applyVariantSwitch,
    cancelVariantSwitch: () => setPendingVariantSwitch(null),
    toggleDecorator,
    updateDecorator,
    updateDraft,
    removeAttachment,
    addFiles,
    addTodoRow,
    updateTodoItem,
    removeTodoRow,
    reorderTodoRow,
    addTodoRowFiles,
    removeTodoRowAttachment,
    send,
    insertReactionIcon,
    canClear: hasDraftContent(draft),
    canSend: hasDraftContent(draft) && !sending,
  };
};
