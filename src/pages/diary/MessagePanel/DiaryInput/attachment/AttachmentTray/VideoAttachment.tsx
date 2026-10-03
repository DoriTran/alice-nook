import type { FC } from 'react';

import { faPlay } from '@fortawesome/free-solid-svg-icons';

import type { VideoAttachment as VideoAttachmentType } from '@/store/diary/type';

import { useAttachmentUrl } from '@/api';
import { AdIcon } from '@/packages/base';

import styles from './VideoAttachment.module.css';

export type VideoAttachmentProps = {
  attachment: VideoAttachmentType;
  variant: 'thumb' | 'player';
  className?: string;
};

const VideoAttachment: FC<VideoAttachmentProps> = ({
  attachment,
  variant,
  className,
}) => {
  const src = useAttachmentUrl(attachment);

  if (variant === 'player') {
    return (
      // User attachments have no caption tracks available.
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video
        className={`${styles.player} ${className ?? ''}`}
        src={src}
        controls
        playsInline
        preload="metadata"
        aria-label={attachment.name ?? 'Video attachment'}
      />
    );
  }

  return (
    <div className={`${styles.thumbWrap} ${className ?? ''}`}>
      <video
        className={styles.thumbVideo}
        src={src}
        muted
        playsInline
        preload="metadata"
        aria-hidden
      />
      <span className={styles.playBadge} aria-hidden>
        <AdIcon icon={faPlay} size={14} />
      </span>
    </div>
  );
};

export default VideoAttachment;
