import { Archive, Pin } from 'lucide-react';
import { useCallback, useMemo, useState, type FC } from 'react';

import type { ColorId } from '@/packages/color';
import type { Message } from '@/store/diary/type';

import type { MediaFilter } from '../../types';
import type { DetailPanelStats, DetailPanelTag } from '../detailPanel.utils';

import MessageListDialog from '../components/MessageListDialog';
import ProgressBarRow from '../components/ProgressBarRow';
import TagMessagesDialog from '../components/TagMessagesDialog';
import { filterMessagesByTags } from '../detailPanel.utils';
import CollapsibleSection from './CollapsibleSection';
import styles from './OverviewTab.module.css';
import StatisticsSection from './StatisticsSection';
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
  const [messageDialog, setMessageDialog] = useState<MessageDialogState>(null);

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

  const handleTagClick = useCallback(
    (tagId: string) => {
      const match = tags.find((entry) => entry.tagId === tagId);

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
    [tags],
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
        {tags.length === 0 ? (
          <p className={styles.emptyTags}>No tags in this chat yet.</p>
        ) : null}
        <ul className={styles.tagRibbonList}>
          {tags.map((tag) => (
            <TagRibbonRow key={tag.tagId} tag={tag} onClick={handleTagClick} />
          ))}
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
