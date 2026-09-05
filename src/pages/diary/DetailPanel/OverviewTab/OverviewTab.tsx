import { Archive, Pin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import type { ColorId } from '@/packages/color';
import type { Message } from '@/store/diary/type';

import { useDiaryStore } from '@/store';

import type { MediaFilter } from '../../types';
import type { DetailPanelStats, DetailPanelTag } from '../detailPanel.utils';

import MessageListDialog from '../components/MessageListDialog';
import ProgressBarRow from '../components/ProgressBarRow';
import TagMessagesDialog from '../components/TagMessagesDialog';
import { filterMessagesByTags } from '../detailPanel.utils';
import CollapsibleSection from './CollapsibleSection';
import styles from './OverviewTab.module.css';
import StatisticsSection from './StatisticsSection';
import TagFormRow from './TagFormRow';
import TagRibbonRow from './TagRibbonRow';

type MessageDialogState =
  | { kind: 'pinned' }
  | { kind: 'archived' }
  | { kind: 'tag'; tagId: string; label: string; colorId: ColorId }
  | null;

export type OverviewTabProps = {
  chatboxId: string;
  stats: DetailPanelStats;
  tags: DetailPanelTag[];
  pinnedMessages: Message[];
  archivedMessages: Message[];
  allMessages: Message[];
  onJumpToMessage: (messageId: string) => void;
  onOpenMedia: (filter: MediaFilter) => void;
};

const OverviewTab: FC<OverviewTabProps> = ({
  chatboxId,
  stats,
  tags,
  pinnedMessages,
  archivedMessages,
  allMessages,
  onJumpToMessage,
  onOpenMedia,
}) => {
  const storeTags = useDiaryStore('tags');

  const [messageDialog, setMessageDialog] = useState<MessageDialogState>(null);
  const [createdTagIds, setCreatedTagIds] = useState<string[]>([]);

  useEffect(() => {
    setCreatedTagIds([]);
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

  const handleTagCreated = useCallback(
    (tag: { tagId: string; label: string; colorId: ColorId }) => {
      setCreatedTagIds((current) =>
        current.includes(tag.tagId) ? current : [tag.tagId, ...current],
      );
    },
    [],
  );

  const handleTagClick = useCallback(
    (tagId: string) => {
      const match = displayTags.find((entry) => entry.tagId === tagId);

      if (!match) {
        return;
      }

      setMessageDialog({
        kind: 'tag',
        tagId,
        label: match.label,
        colorId: match.colorId,
      });
    },
    [displayTags],
  );

  const tagDialog = messageDialog?.kind === 'tag' ? messageDialog : null;

  return (
    <div className={styles.root}>
      <CollapsibleSection title="Statistics">
        <StatisticsSection stats={stats} onOpenMedia={onOpenMedia} />
      </CollapsibleSection>

      <CollapsibleSection title="Messages">
        <div className={styles.progressList}>
          <ProgressBarRow
            label="Pinned"
            icon={<Pin size={14} strokeWidth={1.8} />}
            count={stats.pinnedCount}
            total={stats.totalMessages}
            onClick={() => setMessageDialog({ kind: 'pinned' })}
          />
          <ProgressBarRow
            label="Archived"
            icon={<Archive size={14} strokeWidth={1.8} />}
            count={stats.archivedCount}
            total={stats.totalMessages}
            tone="blue"
            onClick={() => setMessageDialog({ kind: 'archived' })}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Tags">
        {displayTags.length === 0 ? (
          <p className={styles.emptyTags}>No tags in this chat yet.</p>
        ) : null}
        <ul className={styles.tagRibbonList}>
          {displayTags.map((tag) => (
            <TagRibbonRow key={tag.tagId} tag={tag} onClick={handleTagClick} />
          ))}
          <TagFormRow onCreated={handleTagCreated} />
        </ul>
      </CollapsibleSection>

      {tagDialog ? (
        <TagMessagesDialog
          opened
          onClose={() => setMessageDialog(null)}
          chatboxId={chatboxId}
          tagId={tagDialog.tagId}
          label={tagDialog.label}
          colorId={tagDialog.colorId}
          messages={dialogMessages}
          onJumpToMessage={onJumpToMessage}
        />
      ) : (
        <MessageListDialog
          opened={messageDialog !== null}
          onClose={() => setMessageDialog(null)}
          title={dialogTitle}
          messages={dialogMessages}
          showPin={messageDialog?.kind === 'pinned'}
          emptyLabel="No messages"
          onJumpToMessage={onJumpToMessage}
        />
      )}
    </div>
  );
};

export default OverviewTab;
