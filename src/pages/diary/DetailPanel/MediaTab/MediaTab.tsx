import {
  faFile,
  faImage,
  faLink,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';
import { useMemo, useState, type FC } from 'react';

import { resolveAttachmentThumbnail } from '@/api';
import { AdIcon } from '@/packages/base';

import type { MediaFilter } from '../../types';

import InfoCallout from '../components/InfoCallout';
import {
  filterMediaItems,
  formatVideoDuration,
  groupMediaByMonth,
  type DetailPanelMediaItem,
} from '../detailPanel.utils';
import styles from './MediaTab.module.css';

const FILTERS: { id: MediaFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'images', label: 'Images' },
  { id: 'videos', label: 'Videos' },
  { id: 'links', label: 'Links' },
  { id: 'files', label: 'Files' },
];

const PREVIEW_LIMIT = 12;

export type MediaTabProps = {
  mediaItems: DetailPanelMediaItem[];
  onJumpToMessage: (messageId: string) => void;
};

const MediaTab: FC<MediaTabProps> = ({ mediaItems, onJumpToMessage }) => {
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [expanded, setExpanded] = useState(false);

  const filteredItems = useMemo(
    () => filterMediaItems(mediaItems, filter),
    [filter, mediaItems],
  );

  const visibleItems = expanded
    ? filteredItems
    : filteredItems.slice(0, PREVIEW_LIMIT);

  const monthGroups = useMemo(
    () => groupMediaByMonth(visibleItems),
    [visibleItems],
  );

  const getAttachmentLabel = (item: DetailPanelMediaItem): string => {
    const { attachment } = item;

    if (attachment.name) {
      return attachment.name;
    }

    if (attachment.type === 'link') {
      return attachment.url;
    }

    return attachment.url.split('/').pop() ?? 'Attachment';
  };

  const renderCell = (item: DetailPanelMediaItem) => {
    const { attachment } = item;
    const label = getAttachmentLabel(item);

    if (attachment.type === 'file' || attachment.type === 'link') {
      return (
        <button
          key={item.id}
          type="button"
          className={clsx(styles.cell, styles.fileCell)}
          onClick={() => onJumpToMessage(item.messageId)}
          aria-label={`Jump to message with ${label}`}
        >
          <AdIcon
            icon={attachment.type === 'link' ? faLink : faFile}
            size={18}
          />
          <span className={styles.fileLabel}>{label}</span>
          <span className={styles.meta}>{item.timeLabel}</span>
        </button>
      );
    }

    const thumbnail =
      attachment.type === 'image' || attachment.type === 'video'
        ? resolveAttachmentThumbnail(attachment)
        : undefined;

    return (
      <button
        key={item.id}
        type="button"
        className={styles.cell}
        style={
          thumbnail ? { backgroundImage: `url(${thumbnail})` } : undefined
        }
        onClick={() => onJumpToMessage(item.messageId)}
        aria-label={`Jump to message with ${label}`}
      >
        {attachment.type === 'video' ? (
          <>
            <span className={styles.playOverlay} aria-hidden>
              <AdIcon icon={faPlay} size={10} />
            </span>
            {attachment.duration !== undefined ? (
              <span className={styles.duration}>
                {formatVideoDuration(attachment.duration)}
              </span>
            ) : null}
          </>
        ) : (
          <span className={styles.typeIcon} aria-hidden>
            <AdIcon icon={faImage} size={12} />
          </span>
        )}
        <span className={styles.meta}>{item.timeLabel}</span>
      </button>
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.filters}>
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.filterChip}
            data-active={filter === item.id || undefined}
            onClick={() => {
              setFilter(item.id);
              setExpanded(false);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {monthGroups.length > 0 ? (
        <div className={styles.groups}>
          {monthGroups.map((group) => (
            <section key={group.monthKey} className={styles.monthGroup}>
              <h3 className={styles.monthHeading}>{group.label}</h3>
              <div className={styles.grid}>{group.items.map(renderCell)}</div>
            </section>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No media in this chatbox yet.</p>
      )}

      {!expanded && filteredItems.length > PREVIEW_LIMIT ? (
        <button
          type="button"
          className={styles.viewAll}
          onClick={() => setExpanded(true)}
        >
          View all media ({filteredItems.length})
        </button>
      ) : null}

      <InfoCallout>
        Click any media item to jump to its message in the timeline.
      </InfoCallout>
    </div>
  );
};

export default MediaTab;
