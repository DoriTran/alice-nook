import { TagX } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type FC,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import type { ColorId } from '@/packages/color';
import type { Message } from '@/store/diary/type';

import { AdConfirmDialog, AdIcon, AdInput, AdModal } from '@/packages/base';
import { useResolvedPalette } from '@/packages/color';
import PalettePicker from '@/packages/ui/PalettePicker/PalettePicker';
import { useDiaryStore } from '@/store';

import DetailMessagePreviewRow from './DetailMessagePreviewRow';
import styles from './TagMessagesDialog.module.css';

const TAG_SHADES: Array<'strong' | 'soft'> = ['strong', 'soft'];

export type TagMessagesDialogProps = {
  opened: boolean;
  onClose: () => void;
  chatboxId: string;
  tagId: string;
  label: string;
  colorId: ColorId;
  messages: Message[];
  onJumpToMessage: (messageId: string) => void;
};

const TagMessagesDialog: FC<TagMessagesDialogProps> = ({
  opened,
  onClose,
  chatboxId,
  tagId,
  label,
  colorId,
  messages,
  onJumpToMessage,
}) => {
  const tags = useDiaryStore('tags');
  const updateTag = useDiaryStore('updateTag');
  const setMessageTags = useDiaryStore('setMessageTags');
  const removeTagFromChatbox = useDiaryStore('removeTagFromChatbox');

  const liveTag = tags[tagId];
  const currentLabel = liveTag?.label ?? label;
  const currentColorId = liveTag?.colorId ?? colorId;
  const palette = useResolvedPalette(currentColorId);

  const [editing, setEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(currentLabel);
  const [draftColorId, setDraftColorId] = useState<ColorId>(currentColorId);
  const [error, setError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!opened) {
      setEditing(false);
      setError(null);
      setPaletteOpen(false);
      setConfirmEditOpen(false);
      setConfirmClearOpen(false);
      setPendingLabel(null);
      return;
    }

    setDraftLabel(currentLabel);
    setDraftColorId(currentColorId);
  }, [currentColorId, currentLabel, opened]);

  useEffect(() => {
    if (!editing) {
      return;
    }

    labelInputRef.current?.focus();
    labelInputRef.current?.select();
  }, [editing]);

  const submitEdit = () => {
    const nextLabel = draftLabel.trim().replace(/^#/, '');

    if (!nextLabel) {
      setError('Name is required');
      return;
    }

    const duplicate = Object.values(tags).some(
      (tag) =>
        tag.id !== tagId &&
        tag.label.trim().toLowerCase() === nextLabel.toLowerCase(),
    );

    if (duplicate) {
      setError('A tag with this name already exists');
      return;
    }

    const unchanged =
      nextLabel === currentLabel.trim() && draftColorId === currentColorId;

    if (unchanged) {
      setEditing(false);
      setError(null);
      return;
    }

    setPendingLabel(nextLabel);
    setConfirmEditOpen(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
    setPaletteOpen(false);
    setDraftLabel(currentLabel);
    setDraftColorId(currentColorId);
  };

  const clearAllButton = (
    <button
      type="button"
      className={styles.clearAllBtn}
      disabled={messages.length === 0}
      onClick={() => setConfirmClearOpen(true)}
      aria-label={`Clear all #${currentLabel} from this chat`}
    >
      <TagX size={14} strokeWidth={2} aria-hidden />
      Clear all
    </button>
  );

  const titleNode = editing ? (
    <div className={styles.titleRow}>
      <form
        className={styles.titleForm}
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          submitEdit();
        }}
      >
        <PalettePicker
          value={draftColorId}
          onChange={setDraftColorId}
          label=""
          variant="compact"
          shades={TAG_SHADES}
          offset={8}
          stacked
          opened={paletteOpen}
          onOpenChange={setPaletteOpen}
          swatchSize={16}
        />
        <AdInput
          ref={labelInputRef}
          className={styles.titleInput}
          value={draftLabel}
          onChange={(event) => {
            setError(null);
            setDraftLabel(event.currentTarget.value);
          }}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelEdit();
            }
          }}
          aria-label="Edit tag name"
        />
        <button
          type="submit"
          className={styles.titleEditBtn}
          aria-label="Save tag"
        >
          <AdIcon icon="Check" source="lucide" size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          className={styles.titleEditBtn}
          aria-label="Cancel editing tag"
          onClick={cancelEdit}
        >
          <AdIcon icon="X" source="lucide" size={14} strokeWidth={2} />
        </button>
      </form>
      {clearAllButton}
    </div>
  ) : (
    <div className={styles.titleRow}>
      <div className={styles.titleLeading}>
        <span className={styles.titleText} style={{ color: palette.strong }}>
          #{currentLabel}
        </span>
        <button
          type="button"
          className={styles.titleEditBtn}
          aria-label={`Edit tag ${currentLabel}`}
          onClick={() => {
            setDraftLabel(currentLabel);
            setDraftColorId(currentColorId);
            setError(null);
            setEditing(true);
          }}
        >
          <AdIcon icon="Pen" source="lucide" size={14} strokeWidth={1.75} />
        </button>
      </div>
      {clearAllButton}
    </div>
  );

  const confirmLabel = pendingLabel ?? draftLabel.trim().replace(/^#/, '');

  return (
    <>
      <AdModal
        opened={opened}
        onClose={onClose}
        title={titleNode}
        size="lg"
        classNames={{ title: styles.modalTitle }}
      >
        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.list}>
          {messages.length > 0 ? (
            messages.map((message) => (
              <DetailMessagePreviewRow
                key={message.id}
                message={message}
                removeLabel={`Remove #${currentLabel} from this message`}
                onClick={() => {
                  onJumpToMessage(message.id);
                  onClose();
                }}
                onRemove={() => {
                  setMessageTags(
                    message.id,
                    message.tagIds.filter((id) => id !== tagId),
                  );
                }}
              />
            ))
          ) : (
            <p className={styles.empty}>No messages with this tag</p>
          )}
        </div>
      </AdModal>

      <AdConfirmDialog
        opened={confirmEditOpen}
        onClose={() => {
          setConfirmEditOpen(false);
          setPendingLabel(null);
        }}
        onConfirm={() => {
          updateTag(tagId, {
            label: confirmLabel,
            colorId: draftColorId,
          });
          setConfirmEditOpen(false);
          setPendingLabel(null);
          setEditing(false);
          setError(null);
          setPaletteOpen(false);
        }}
        title="Edit tag everywhere?"
        message={`Changes to “#${confirmLabel}” will update this tag across the whole app — every chat and message that uses it.`}
        confirmLabel="Save changes"
      />

      <AdConfirmDialog
        opened={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={() => {
          removeTagFromChatbox(chatboxId, tagId);
          setConfirmClearOpen(false);
          onClose();
        }}
        title="Remove tag from this chat?"
        message={`“#${currentLabel}” will be removed from all messages in this chat. The tag itself stays available elsewhere.`}
        confirmLabel="Remove"
        destructive
      />
    </>
  );
};

export default TagMessagesDialog;
