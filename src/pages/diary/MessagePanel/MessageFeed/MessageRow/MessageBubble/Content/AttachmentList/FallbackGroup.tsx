import type { FC } from 'react';

import type { Attachment } from '@/store/diary/type';

import { useAttachmentUrl } from '@/api';

import styles from './FallbackGroup.module.css';

export type FallbackGroupProps = {
  attachments: Attachment[];
  compact?: boolean;
};

/**
 * Render used for any attachment type without a dedicated renderer
 * (`file` today, plus any new type added later): just its file name +
 * extension, nothing else.
 */
const FileItem: FC<{ attachment: Attachment }> = ({ attachment }) => {
  const url = useAttachmentUrl(attachment);
  const name = attachment.name ?? attachment.url?.split('/').pop() ?? 'file';
  return url ? (
    <a href={url} className={styles.item} target="_blank" rel="noreferrer">
      {name}
    </a>
  ) : (
    <span className={styles.item}>{name}</span>
  );
};

const FallbackGroup: FC<FallbackGroupProps> = ({
  attachments,
  compact = false,
}) => (
  <div className={`${styles.list} ${compact ? styles.listCompact : ''}`}>
    {attachments.map((attachment) => (
      <FileItem key={attachment.id} attachment={attachment} />
    ))}
  </div>
);

export default FallbackGroup;
