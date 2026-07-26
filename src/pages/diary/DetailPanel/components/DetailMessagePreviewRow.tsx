import { TagX } from 'lucide-react';
import type { FC, MouseEvent } from 'react';

import type { Message, PreviewTile } from '@/store/diary/type';

import { AdEmojiText, AdIcon } from '@/packages/base';
import { resolveMessagePreview } from '@/store/diary/messagePreview.utils';

import styles from './DetailMessagePreviewRow.module.css';

export type DetailMessagePreviewRowProps = {
  message: Message;
  showPin?: boolean;
  tagLabels?: string[];
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
};

const PreviewTileView: FC<{ tile: PreviewTile }> = ({ tile }) => {
  if (tile.kind === 'media') {
    return (
      <span
        className={styles.previewMedia}
        style={{ backgroundImage: `url(${tile.thumbnailUrl})` }}
        aria-hidden
      />
    );
  }

  if (tile.kind === 'link') {
    if (tile.previewUrl) {
      return (
        <span
          className={styles.previewMedia}
          style={{ backgroundImage: `url(${tile.previewUrl})` }}
          aria-hidden
        />
      );
    }

    return (
      <span className={styles.previewLink} aria-hidden>
        <span className={styles.previewLinkHost}>{tile.hostname}</span>
      </span>
    );
  }

  return (
    <span className={styles.previewFile} aria-hidden>
      <span className={styles.previewFileExt}>{tile.extension}</span>
    </span>
  );
};

const DetailMessagePreviewRow: FC<DetailMessagePreviewRowProps> = ({
  message,
  showPin = false,
  tagLabels = [],
  onClick,
  onRemove,
  removeLabel = 'Remove',
}) => {
  const preview = resolveMessagePreview(message);

  const handleRemove = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onRemove?.();
  };

  return (
    <div className={styles.row}>
      <button type="button" className={styles.root} onClick={onClick}>
        <span
          className={styles.iconTile}
          style={{
            background: preview.iconBg,
            color: preview.iconColor,
          }}
          aria-hidden
        >
          <AdIcon
            icon={preview.icon}
            source="lucide"
            size={18}
            strokeWidth={1.75}
            color={preview.iconColor}
          />
        </span>

        <span className={styles.body}>
          <span className={styles.titleRow}>
            <span className={styles.titleText}>
              <AdEmojiText text={preview.title} />
            </span>
            {showPin ? (
              <span className={styles.pinIcon} aria-hidden>
                <AdIcon
                  icon="Pin"
                  source="lucide"
                  size="0.85em"
                  strokeWidth={2.25}
                  color="currentColor"
                />
              </span>
            ) : null}
          </span>
          {tagLabels.length > 0 ? (
            <span className={styles.tags}>{tagLabels.join(' · ')}</span>
          ) : null}
          <time className={styles.time}>{preview.timeLabel}</time>
        </span>

        {preview.preview ? (
          <span className={styles.previewWrap}>
            <PreviewTileView tile={preview.preview} />
            {preview.attachmentCount > 0 ? (
              <span className={styles.badge}>{preview.attachmentCount}</span>
            ) : null}
          </span>
        ) : null}
      </button>

      {onRemove ? (
        <button
          type="button"
          className={styles.removeBtn}
          aria-label={removeLabel}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={handleRemove}
        >
          <TagX size={14} strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </div>
  );
};

export default DetailMessagePreviewRow;
