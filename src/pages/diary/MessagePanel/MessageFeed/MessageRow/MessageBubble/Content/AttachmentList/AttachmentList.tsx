import type { FC, ReactNode } from 'react';

import clsx from 'clsx';

import type {
  Attachment,
  ImageAttachment,
  VideoAttachment,
} from '@/store/diary/type';

import styles from './AttachmentList.module.css';
import FallbackGroup from './FallbackGroup';
import { groupAttachmentsByType } from './groupAttachments.utils';
import ImageGroup from './ImageGroup';
import VideoGroup from './VideoGroup';

export type AttachmentListAlign = 'start' | 'end';

export type AttachmentListProps = {
  attachments: Attachment[];
  compact?: boolean;
  /** Which side the message bubble hugs — mirrors the sender's alignment. */
  align?: AttachmentListAlign;
  /** Jump-to / pin highlight target when this list is the message surface. */
  messageSurface?: boolean;
};

const renderGroup = (
  group: Attachment[],
  compact: boolean,
  align: AttachmentListAlign,
): ReactNode => {
  switch (group[0].type) {
    case 'image':
      return <ImageGroup attachments={group as ImageAttachment[]} />;

    case 'video':
      return (
        <VideoGroup attachments={group as VideoAttachment[]} align={align} />
      );

    case 'link':
      // TODO: link preview popout — no render for now (URL already shows in
      // the message text).
      return null;

    default:
      return <FallbackGroup attachments={group} compact={compact} />;
  }
};

const AttachmentList: FC<AttachmentListProps> = ({
  attachments,
  compact = false,
  align = 'end',
  messageSurface = false,
}) => {
  if (attachments.length === 0) {
    return null;
  }

  const groups = groupAttachmentsByType(attachments);

  return (
    <div
      className={clsx(
        styles.attachmentList,
        align === 'start' ? styles.alignStart : styles.alignEnd,
        compact && styles.compact,
      )}
      data-message-surface={messageSurface || undefined}
    >
      {groups.map((group) => (
        <div key={group[0].id}>{renderGroup(group, compact, align)}</div>
      ))}
    </div>
  );
};

export default AttachmentList;
