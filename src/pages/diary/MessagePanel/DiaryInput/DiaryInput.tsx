import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
  forwardRef,
  useImperativeHandle,
} from 'react';

import type {
  AdRichTextHandle,
  ContentFeatureAnchor,
  ContentFeatureId,
  ContentFeatureState,
} from '@/packages/base';

import { useSettingsStore } from '@/store';

import LinkContentPreviews from '../LinkPreview/LinkContentPreviews';
import ActionDock from './actions/ActionDock/ActionDock';
import ReactionIconPicker from './actions/ReactionIconPicker';
import AttachmentTray from './attachment/AttachmentTray/AttachmentTray';
import OversizedAttachmentDialog from './attachment/OversizedAttachmentDialog';
import ContentShelf from './content/ContentShelf';
import DecoratedSurface from './decorator/DecoratedSurface/DecoratedSurface';
import styles from './DiaryInput.module.css';
import ReplyPreviewInput from './input/ReplyPreviewInput';
import { useComposerDraft } from './input/useComposerDraft';
import AIEditor from './variant/editors/AIEditor';
import TextEditor from './variant/editors/TextEditor';
import TodoEditor, {
  type TodoEditorHandle,
} from './variant/editors/TodoEditor';
import TypeSwitchModal from './variant/TypeSwitchModal';

export type DiaryInputProps = {
  chatboxId: string;
  replyToMessageId?: string | null;
  onCancelReply?: () => void;
  editMessageId?: string | null;
  onCancelEdit?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onNavigateToMessage?: (messageId: string) => void;
  hasCopiedMessage?: boolean;
  onClearCopiedMessage?: () => void;
  onPasteCopiedMessage?: () => void;
};

export type DiaryInputHandle = {
  addDroppedFiles: (files: FileList | File[]) => void;
};

const DiaryInput = forwardRef<DiaryInputHandle, DiaryInputProps>(
  (
    {
      chatboxId,
      replyToMessageId = null,
      onCancelReply,
      editMessageId = null,
      onCancelEdit,
      onDirtyChange,
      onNavigateToMessage,
      hasCopiedMessage = false,
      onClearCopiedMessage,
      onPasteCopiedMessage,
    },
    ref,
  ) => {
    const preferences = useSettingsStore('preferences');
    const enterKeyBehavior = preferences.composer.enterKeyBehavior;
    const todoEnterKeyBehavior = preferences.decorations.todo.enterKeyBehavior;
    const todoEditorRef = useRef<TodoEditorHandle>(null);
    const activeEditorRef = useRef<AdRichTextHandle | null>(null);
    const [contentShelfOpen, setContentShelfOpen] = useState(false);
    const [contentFeatureState, setContentFeatureState] =
      useState<ContentFeatureState>({});
    const [linkEditorOpen, setLinkEditorOpen] = useState(false);
    const [contentInspectorTarget, setContentInspectorTarget] =
      useState<HTMLDivElement | null>(null);
    const contentShelfLayerRef = useRef<HTMLDivElement>(null);
    const [contentInspectorLeft, setContentInspectorLeft] = useState(0);
    const [contactEditorFeature, setContactEditorFeature] = useState<
      'phone' | 'email' | null
    >(null);

    useLayoutEffect(() => {
      const layer = contentShelfLayerRef.current;
      const host = contentInspectorTarget;
      if (!layer || !host || !contentShelfOpen) return;

      const updatePosition = () => {
        const linkButton = layer.querySelector<HTMLElement>(
          '[data-content-feature="link"]',
        );
        if (!linkButton) return;
        const layerRect = layer.getBoundingClientRect();
        const buttonRect = linkButton.getBoundingClientRect();
        const inspectorWidth = Math.min(
          host.getBoundingClientRect().width || 352,
          layerRect.width,
        );
        const desiredLeft =
          buttonRect.left +
          buttonRect.width / 2 -
          layerRect.left -
          inspectorWidth / 2;
        const nextLeft = Math.max(
          0,
          Math.min(desiredLeft, layerRect.width - inspectorWidth),
        );
        setContentInspectorLeft((current) =>
          Math.abs(current - nextLeft) < 0.5 ? current : nextLeft,
        );
      };

      updatePosition();
      const observer = new ResizeObserver(updatePosition);
      observer.observe(layer);
      const linkButton = layer.querySelector<HTMLElement>(
        '[data-content-feature="link"]',
      );
      if (linkButton) observer.observe(linkButton);
      window.addEventListener('resize', updatePosition);
      return () => {
        observer.disconnect();
        window.removeEventListener('resize', updatePosition);
      };
    }, [contentInspectorTarget, contentShelfOpen]);

    const {
      draft,
      editorRef,
      isEditing,
      pendingVariantSwitch,
      oversizedFiles,
      setFocused,
      setContent,
      clearAll,
      cancelEdit,
      requestVariantSwitch,
      applyVariantSwitch,
      cancelVariantSwitch,
      dismissOversizedFiles,
      toggleDecorator,
      updateDecorator,
      updateDraft,
      removeAttachment,
      addFiles,
      addTodoRow,
      insertTodoRowAfter,
      updateTodoItem,
      removeTodoRow,
      reorderTodoRow,
      addTodoRowFiles,
      removeTodoRowAttachment,
      send,
      insertReactionIcon,
      canSend,
      canClear,
    } = useComposerDraft(chatboxId, {
      replyToMessageId,
      onReplyClear: onCancelReply,
      editMessageId,
      onEditClear: onCancelEdit,
      onDirtyChange,
    });

    const handleFocus = () => setFocused(true);
    const handleBlur = () => {
      window.setTimeout(() => setFocused(false), 100);
    };

    const handleSubmit = () => {
      if (!canSend) {
        return;
      }
      setContentShelfOpen(false);
      const finalizedContent =
        draft.variant === 'text'
          ? editorRef.current?.finalizeContentEntities()
          : draft.variant === 'todo'
            ? {
                todoItems:
                  todoEditorRef.current?.finalizeItems() ?? draft.todoItems,
              }
            : undefined;
      activeEditorRef.current = null;
      setContentFeatureState({});
      void send(finalizedContent);
    };

    useEffect(() => {
      activeEditorRef.current = null;
      setContentShelfOpen(false);
      setContentFeatureState({});
      setLinkEditorOpen(false);
      setContactEditorFeature(null);
    }, [chatboxId, draft.variant]);

    const handleRunContentFeature = (
      id: ContentFeatureId,
      anchor?: ContentFeatureAnchor,
    ) => {
      activeEditorRef.current?.runContentFeature(id, anchor);
    };

    const handleClear = () => {
      setContentShelfOpen(false);
      activeEditorRef.current = null;
      setContentFeatureState({});
      clearAll();
    };

    const handleCancelEdit = () => {
      setContentShelfOpen(false);
      activeEditorRef.current = null;
      setContentFeatureState({});
      cancelEdit();
    };

    const handleVariantSwitch = (
      variant: Parameters<typeof requestVariantSwitch>[0],
    ) => {
      setContentShelfOpen(false);
      requestVariantSwitch(variant);
    };

    const handleAddFiles = (
      files: FileList | File[],
      kind: 'file' | 'image' | 'video',
    ) => {
      void addFiles(files, kind);
    };

    const handleTodoAddFiles = (itemId: string, files: FileList | File[]) => {
      void addTodoRowFiles(itemId, files);
    };

    useImperativeHandle(
      ref,
      () => ({
        addDroppedFiles: (files) => {
          if (draft.variant === 'todo') {
            todoEditorRef.current?.addFilesAtLatestInput(files);
            return;
          }
          void addFiles(files, 'file');
        },
      }),
      [addFiles, draft.variant],
    );

    const handlePaste = (event: ClipboardEvent<HTMLElement>) => {
      const mediaFiles = Array.from(event.clipboardData.files).filter(
        (file) =>
          file.type.startsWith('image/') || file.type.startsWith('video/'),
      );

      if (mediaFiles.length === 0) {
        return;
      }

      event.preventDefault();
      handleAddFiles(mediaFiles, 'file');
    };

    const renderEditor = () => {
      if (draft.variant === 'todo') {
        return (
          <TodoEditor
            key={chatboxId}
            ref={todoEditorRef}
            items={draft.todoItems}
            onUpdateItem={updateTodoItem}
            onRemoveItem={removeTodoRow}
            onAddRow={addTodoRow}
            onInsertRowAfter={insertTodoRowAfter}
            onAddFiles={handleTodoAddFiles}
            onRemoveAttachment={removeTodoRowAttachment}
            onReorderItem={reorderTodoRow}
            onSubmit={handleSubmit}
            enterKeyBehavior={todoEnterKeyBehavior}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onActiveEditorChange={(_itemId, editor) => {
              activeEditorRef.current = editor;
              setContentFeatureState(editor?.getContentFeatureState() ?? {});
            }}
            onContentFeatureStateChange={setContentFeatureState}
            onContentLinkEditorOpenChange={(open) => {
              setLinkEditorOpen(open);
              if (open) setContentShelfOpen(true);
            }}
            contentInspectorTarget={contentInspectorTarget}
            onContentContactEditorOpenChange={setContactEditorFeature}
          />
        );
      }

      if (draft.variant === 'ai') {
        return (
          <AIEditor
            key={chatboxId}
            editorRef={editorRef}
            value={draft.content}
            onChange={setContent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmit={handleSubmit}
            enterKeyBehavior={enterKeyBehavior}
          />
        );
      }

      return (
        <TextEditor
          key={chatboxId}
          ref={editorRef}
          value={draft.content}
          maxRows={8}
          onChange={setContent}
          onFocus={() => {
            activeEditorRef.current = editorRef.current;
            handleFocus();
          }}
          onBlur={handleBlur}
          onSubmit={handleSubmit}
          onContentFeatureStateChange={setContentFeatureState}
          onContentLinkEditorOpenChange={(open) => {
            setLinkEditorOpen(open);
            if (open) setContentShelfOpen(true);
          }}
          contentInspectorTarget={contentInspectorTarget}
          onContentContactEditorOpenChange={setContactEditorFeature}
          enterKeyBehavior={enterKeyBehavior}
        />
      );
    };

    const fileAttachments = draft.attachments.filter(
      (item) => item.type !== 'link',
    );

    const handleInsertReactionIcon = (icon: string) => {
      if (draft.variant === 'todo') {
        todoEditorRef.current?.insertAtLatestInput(icon);
        return;
      }

      insertReactionIcon(icon);
    };

    return (
      <footer
        className={styles.root}
        onPasteCapture={handlePaste}
        onKeyDownCapture={(event) => {
          if (event.key === 'Escape' && contentShelfOpen) {
            setContentShelfOpen(false);
          }
        }}
      >
        <div className={styles.dock}>
          <div className={styles.editorStack}>
            <AttachmentTray
              attachments={fileAttachments}
              focused={draft.focused}
              onRemove={removeAttachment}
              onAddFiles={handleAddFiles}
            />

            {contentShelfOpen ? (
              <div
                ref={contentShelfLayerRef}
                className={styles.contentShelfLayer}
              >
                <div
                  ref={setContentInspectorTarget}
                  className={styles.contentInspectorHost}
                  style={{ left: contentInspectorLeft }}
                />
                <ContentShelf
                  activeFeatures={contentFeatureState}
                  onRunFeature={handleRunContentFeature}
                  suppressTooltipFor={
                    linkEditorOpen
                      ? 'link'
                      : (contactEditorFeature ?? undefined)
                  }
                />
              </div>
            ) : null}

            {replyToMessageId ? (
              <ReplyPreviewInput
                replyToMessageId={replyToMessageId}
                onCancel={() => onCancelReply?.()}
                onJump={(messageId) => onNavigateToMessage?.(messageId)}
              />
            ) : null}

            <DecoratedSurface
              draft={draft}
              composing
              borderless
              updateDecorator={updateDecorator}
              updateDraft={updateDraft}
            >
              {renderEditor()}
            </DecoratedSurface>
            {draft.variant === 'text' ? (
              <LinkContentPreviews
                content={draft.content}
                composer
                attached
                onDisablePreview={(url) =>
                  editorRef.current?.setContentLinkPreviewEnabled(url, false)
                }
              />
            ) : null}
          </div>

          <ActionDock
            variant={draft.variant}
            decorators={draft.decorators}
            canSend={canSend}
            canClear={canClear}
            editing={isEditing}
            onClear={handleClear}
            onAddFiles={handleAddFiles}
            onToggleDecorator={toggleDecorator}
            onVariantSwitch={handleVariantSwitch}
            contentShelfOpen={contentShelfOpen}
            contentAvailable={draft.variant !== 'ai'}
            contentFeatureState={contentFeatureState}
            onContentShelfOpenChange={(open) => {
              if (!open && linkEditorOpen) return;
              setContentShelfOpen(open);
            }}
            onRunContentFeature={handleRunContentFeature}
            reactionPicker={
              <ReactionIconPicker onSelect={handleInsertReactionIcon} />
            }
            onSend={handleSubmit}
            onCancelEdit={handleCancelEdit}
            onConfirmEdit={handleSubmit}
            hasCopiedMessage={hasCopiedMessage}
            onClearCopiedMessage={onClearCopiedMessage}
            onPasteCopiedMessage={onPasteCopiedMessage}
          />
        </div>

        <TypeSwitchModal
          nextVariant={pendingVariantSwitch?.nextVariant ?? null}
          onConfirm={() => {
            if (pendingVariantSwitch) {
              applyVariantSwitch(pendingVariantSwitch.nextVariant);
            }
          }}
          onCancel={cancelVariantSwitch}
        />
        <OversizedAttachmentDialog
          files={oversizedFiles}
          onClose={dismissOversizedFiles}
        />
      </footer>
    );
  },
);

DiaryInput.displayName = 'DiaryInput';

export default DiaryInput;
