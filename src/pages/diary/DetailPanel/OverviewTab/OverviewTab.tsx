import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import type { ColorId } from '@/packages/color';
import type { Message } from '@/store/diary/type';

import { AdConfirmDialog } from '@/packages/base';
import { useDiaryStore } from '@/store';

import type { DetailPanelStats, DetailPanelTag } from '../detailPanel.utils';

import MessageListDialog from '../components/MessageListDialog';
import ProgressBarRow from '../components/ProgressBarRow';
import { filterMessagesByTags } from '../detailPanel.utils';
import CollapsibleSection from './CollapsibleSection';
import styles from './OverviewTab.module.css';
import StatisticsSection from './StatisticsSection';
import TagFormRow from './TagFormRow';
import TagPillRow from './TagPillRow';

type MessageDialogState =
  | { kind: 'pinned' }
  | { kind: 'archived' }
  | { kind: 'tag'; tagId: string; label: string }
  | null;

export type OverviewTabProps = {
  chatboxId: string;
  stats: DetailPanelStats;
  tags: DetailPanelTag[];
  pinnedMessages: Message[];
  archivedMessages: Message[];
  allMessages: Message[];
  onJumpToMessage: (messageId: string) => void;
};

const OverviewTab: FC<OverviewTabProps> = ({
  chatboxId,
  stats,
  tags,
  pinnedMessages,
  archivedMessages,
  allMessages,
  onJumpToMessage,
}) => {
  const storeTags = useDiaryStore('tags');
  const removeTagFromChatbox = useDiaryStore('removeTagFromChatbox');

  const [messageDialog, setMessageDialog] = useState<MessageDialogState>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [createdTagIds, setCreatedTagIds] = useState<string[]>([]);

  useEffect(() => {
    setCreatedTagIds([]);
    setEditingTagId(null);
  }, [chatboxId]);

  const displayTags = useMemo(() => {
    const usedIds = new Set(tags.map((tag) => tag.tagId));
    const extras: DetailPanelTag[] = [];

    for (const tagId of createdTagIds) {
      if (usedIds.has(tagId)) {
        continue;
      }

      const tag = storeTags[tagId];

      if (!tag) {
        continue;
      }

      extras.push({
        tagId: tag.id,
        label: tag.label,
        count: 0,
        colorId: tag.colorId,
      });
    }

    return [...extras, ...tags];
  }, [createdTagIds, storeTags, tags]);

  const deletingTag = useMemo(
    () => displayTags.find((tag) => tag.tagId === deletingTagId) ?? null,
    [deletingTagId, displayTags],
  );

  const dialogMessages = useMemo(() => {
    if (!messageDialog) {
      return [];
    }

    if (messageDialog.kind === 'pinned') {
      return pinnedMessages;
    }

    if (messageDialog.kind === 'archived') {
      return archivedMessages;
    }

    return filterMessagesByTags(allMessages, [messageDialog.tagId]);
  }, [allMessages, archivedMessages, messageDialog, pinnedMessages]);

  const dialogTitle = useMemo(() => {
    if (!messageDialog) {
      return '';
    }

    if (messageDialog.kind === 'pinned') {
      return 'Pinned messages';
    }

    if (messageDialog.kind === 'archived') {
      return 'Archived messages';
    }

    return `#${messageDialog.label}`;
  }, [messageDialog]);

  const handleDeleteTag = useCallback(() => {
    if (!deletingTagId) {
      return;
    }

    removeTagFromChatbox(chatboxId, deletingTagId);
    setCreatedTagIds((current) =>
      current.filter((tagId) => tagId !== deletingTagId),
    );
    setEditingTagId((current) =>
      current === deletingTagId ? null : current,
    );
    setDeletingTagId(null);
  }, [chatboxId, deletingTagId, removeTagFromChatbox]);

  const handleTagCreated = useCallback(
    (tag: { tagId: string; label: string; colorId: ColorId }) => {
      setCreatedTagIds((current) =>
        current.includes(tag.tagId) ? current : [tag.tagId, ...current],
      );
    },
    [],
  );

  return (
    <div className={styles.root}>
      <CollapsibleSection title="Statistics">
        <StatisticsSection stats={stats} />
      </CollapsibleSection>

      <CollapsibleSection title="Messages">
        <div className={styles.progressList}>
          <ProgressBarRow
            label="Pinned Message"
            count={stats.pinnedCount}
            total={stats.totalMessages}
            onClick={() => setMessageDialog({ kind: 'pinned' })}
          />
          <ProgressBarRow
            label="Archived Message"
            count={stats.archivedCount}
            total={stats.totalMessages}
            tone="blue"
            onClick={() => setMessageDialog({ kind: 'archived' })}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Tags">
        <ul className={styles.tagPillList}>
          <TagFormRow mode="create" onCreated={handleTagCreated} />
          {displayTags.map((tag) => (
            <TagPillRow
              key={tag.tagId}
              tag={tag}
              editing={editingTagId === tag.tagId}
              onPillClick={(tagId) => {
                const match = displayTags.find(
                  (entry) => entry.tagId === tagId,
                );

                if (!match) {
                  return;
                }

                setMessageDialog({
                  kind: 'tag',
                  tagId,
                  label: match.label,
                });
              }}
              onEdit={setEditingTagId}
              onCancelEdit={() => setEditingTagId(null)}
              onSaved={() => setEditingTagId(null)}
              onDelete={setDeletingTagId}
            />
          ))}
        </ul>
        {displayTags.length === 0 ? (
          <p className={styles.emptyTags}>No tags in this chat yet.</p>
        ) : null}
      </CollapsibleSection>

      <MessageListDialog
        opened={messageDialog !== null}
        onClose={() => setMessageDialog(null)}
        title={dialogTitle}
        messages={dialogMessages}
        showPin={messageDialog?.kind === 'pinned'}
        emptyLabel={
          messageDialog?.kind === 'tag'
            ? 'No messages with this tag'
            : 'No messages'
        }
        onJumpToMessage={onJumpToMessage}
      />

      <AdConfirmDialog
        opened={deletingTag !== null}
        onClose={() => setDeletingTagId(null)}
        onConfirm={handleDeleteTag}
        title="Remove tag from this chat?"
        message={
          deletingTag
            ? `“#${deletingTag.label}” will be removed from all messages in this chat. The tag itself stays available elsewhere.`
            : undefined
        }
        confirmLabel="Remove"
        destructive
      />
    </div>
  );
};

export default OverviewTab;
