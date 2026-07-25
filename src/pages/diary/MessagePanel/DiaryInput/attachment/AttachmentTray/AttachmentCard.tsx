import type { FC } from 'react';

import { faXmark } from '@fortawesome/free-solid-svg-icons';

import type { Attachment } from '@/store/diary/type';

import { resolveAttachmentUrl } from '@/api';
import { AdIcon } from '@/packages/base';
import {
  getAttachmentKind,
  isBinaryAttachment,
} from '@/store/diary/attachment.registry';

import { formatFileSize } from '../../input/composer.utils';
import styles from './AttachmentTray.module.css';
import VideoAttachment from './VideoAttachment';

export type AttachmentCardProps = {
  attachment: Attachment;
  compact?: boolean;
  variant?: 'default' | 'tray';
  /** When true, omit name/size labels (tray file cards become icon-only). */
  hideName?: boolean;
  /** Smaller tray thumbnails for tight contexts (e.g. todo rows). */
  dense?: boolean;
  onRemove?: () => void;
};

const AttachmentCard: FC<AttachmentCardProps> = ({
  attachment,
  compact = false,
  variant = 'default',
  hideName = false,
  dense = false,
  onRemove,
}) => {
  const name = attachment.name ?? attachment.url.split('/').pop() ?? 'file';
  const size = isBinaryAttachment(attachment)
    ? formatFileSize(attachment.size)
    : '';
  const isMedia = attachment.type === 'image' || attachment.type === 'video';
  const binaryIcon = isBinaryAttachment(attachment)
    ? getAttachmentKind(attachment.type).lucideIcon
    : 'File';

  if (variant === 'tray' && isMedia) {
    return (
      <div
        className={`${styles.trayMediaCard} ${dense ? styles.trayCardDense : ''}`}
      >
        <div className={styles.trayMediaThumb}>
          {attachment.type === 'image' ? (
            <img
              src={resolveAttachmentUrl(attachment.url, 'image')}
              alt=""
              className={styles.thumbImage}
            />
          ) : (
            <VideoAttachment attachment={attachment} variant="thumb" />
          )}
        </div>
        {onRemove ? (
          <button
            type="button"
            className={styles.removeBtn}
            aria-label={`Remove ${name}`}
            onClick={onRemove}
          >
            <AdIcon icon={faXmark} size={8} />
          </button>
        ) : null}
      </div>
    );
  }

  if (variant === 'tray' && isBinaryAttachment(attachment)) {
    return (
      <div
        className={`${styles.trayFileCard} ${dense ? styles.trayCardDense : ''}`}
      >
        <div className={styles.trayFileIcon}>
          <AdIcon
            icon={binaryIcon}
            source="lucide"
            size={dense ? 12 : 14}
            strokeWidth={1.75}
          />
        </div>
        {!hideName ? (
          <>
            <span className={styles.trayFileName}>{name}</span>
            {size ? <span className={styles.trayFileSize}>{size}</span> : null}
          </>
        ) : null}
        {onRemove ? (
          <button
            type="button"
            className={styles.removeBtn}
            aria-label={`Remove ${name}`}
            onClick={onRemove}
          >
            <AdIcon icon={faXmark} size={8} />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${compact ? styles.cardCompact : ''}`}>
      <div className={`${styles.thumb} ${compact ? styles.thumbCompact : ''}`}>
        {attachment.type === 'image' ? (
          <img
            src={resolveAttachmentUrl(attachment.url, 'image')}
            alt=""
            className={styles.thumbImage}
          />
        ) : attachment.type === 'video' ? (
          <VideoAttachment attachment={attachment} variant="thumb" />
        ) : (
          <AdIcon
            icon={binaryIcon}
            source="lucide"
            size={compact ? 10 : 12}
            strokeWidth={1.75}
          />
        )}
      </div>
      <div className={styles.meta}>
        <span className={styles.name}>{name}</span>
        {size ? <span className={styles.size}>{size}</span> : null}
      </div>
      {onRemove ? (
        <button
          type="button"
          className={styles.removeBtn}
          aria-label={`Remove ${name}`}
          onClick={onRemove}
        >
          <AdIcon icon={faXmark} size={8} />
        </button>
      ) : null}
    </div>
  );
};

export default AttachmentCard;
