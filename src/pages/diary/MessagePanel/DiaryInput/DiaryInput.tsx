import type { FC } from 'react';

import { useSettingsStore } from '@/store';

import ActionDock from './actions/ActionDock/ActionDock';
import ReactionIconPicker from './actions/ReactionIconPicker';
import AttachmentTray from './attachment/AttachmentTray/AttachmentTray';
import DecoratedSurface from './decorator/DecoratedSurface/DecoratedSurface';
import styles from './DiaryInput.module.css';
import ReplyPreviewInput from './input/ReplyPreviewInput';
import { useComposerDraft } from './input/useComposerDraft';
import AIEditor from './variant/editors/AIEditor';
import TextEditor from './variant/editors/TextEditor';
import TodoEditor from './variant/editors/TodoEditor';
import TypeSwitchModal from './variant/TypeSwitchModal';

export type DiaryInputProps = {
  chatboxId: string;
  replyToMessageId?: string | null;
  onCancelReply?: () => void;
  editMessageId?: string | null;
  onCancelEdit?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onNavigateToMessage?: (messageId: string) => void;
};

const DiaryInput: FC<DiaryInputProps> = ({
  chatboxId,
  replyToMessageId = null,
  onCancelReply,
  editMessageId = null,
  onCancelEdit,
  onDirtyChange,
  onNavigateToMessage,
}) => {
  const preferences = useSettingsStore('preferences');
  const enterKeyBehavior = preferences.composer.enterKeyBehavior;
  const todoEnterKeyBehavior = preferences.decorations.todo.enterKeyBehavior;

  const {
    draft,
    editorRef,
    isEditing,
    pendingVariantSwitch,
    setFocused,
    setContent,
    clearAll,
    cancelEdit,
    requestVariantSwitch,
    applyVariantSwitch,
    cancelVariantSwitch,
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
    void send();
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

  const renderEditor = () => {
    if (draft.variant === 'todo') {
      return (
        <TodoEditor
          items={draft.todoItems}
          onUpdateItem={updateTodoItem}
          onRemoveItem={removeTodoRow}
          onAddRow={addTodoRow}
          onAddFiles={handleTodoAddFiles}
          onRemoveAttachment={removeTodoRowAttachment}
          onReorderItem={reorderTodoRow}
          onSubmit={handleSubmit}
          enterKeyBehavior={todoEnterKeyBehavior}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      );
    }

    if (draft.variant === 'ai') {
      return (
        <AIEditor
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
        ref={editorRef}
        value={draft.content}
        maxRows={8}
        onChange={setContent}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmit={handleSubmit}
        enterKeyBehavior={enterKeyBehavior}
      />
    );
  };

  const fileAttachments = draft.attachments.filter(
    (item) => item.type !== 'link',
  );

  return (
    <footer className={styles.root}>
      <div className={styles.dock}>
        <div className={styles.editorStack}>
          <AttachmentTray
            attachments={fileAttachments}
            focused={draft.focused}
            onRemove={removeAttachment}
            onAddFiles={handleAddFiles}
          />

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
        </div>

        <ActionDock
          variant={draft.variant}
          decorators={draft.decorators}
          canSend={canSend}
          canClear={canClear}
          editing={isEditing}
          onClear={clearAll}
          onAddFiles={handleAddFiles}
          onToggleDecorator={toggleDecorator}
          onVariantSwitch={requestVariantSwitch}
          reactionPicker={
            draft.variant === 'text' || draft.variant === 'ai' ? (
              <ReactionIconPicker onSelect={insertReactionIcon} />
            ) : null
          }
          onSend={() => void send()}
          onCancelEdit={cancelEdit}
          onConfirmEdit={() => void send()}
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
    </footer>
  );
};

export default DiaryInput;
