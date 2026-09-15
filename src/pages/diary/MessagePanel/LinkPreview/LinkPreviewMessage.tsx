import { useEffect, useState, type FC } from 'react';

import type { LinkPreviewMetadata, LinkPreviewState } from '@/store/diary/type';

import { resolveLinkPreview } from '@/api';
import { useDiaryStore } from '@/store';

import LinkPreviewCard from './LinkPreviewCard';
import styles from './LinkPreviewMessage.module.css';

export type LinkPreviewMessageProps = {
  preview: LinkPreviewState;
  messageId: string;
  attached?: boolean;
  disabled?: boolean;
};

const LinkPreviewMessage: FC<LinkPreviewMessageProps> = ({
  preview,
  messageId,
  attached = false,
  disabled = false,
}) => {
  const patchMessage = useDiaryStore('patchMessage');
  const [metadata, setMetadata] = useState<LinkPreviewMetadata | undefined>(
    preview.metadata,
  );
  useEffect(() => {
    if (preview.metadata || disabled) {
      setMetadata(preview.metadata);
      return;
    }
    let stale = false;
    void resolveLinkPreview(preview.normalizedUrl)
      .then((next) => {
        if (!stale) {
          setMetadata(next);
          void patchMessage(messageId, {
            linkPreview: { ...preview, metadata: next },
          }).catch(() => undefined);
        }
      })
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [disabled, messageId, patchMessage, preview]);

  return (
    <div className={`${styles.root} ${attached ? styles.attached : ''}`}>
      <LinkPreviewCard
        url={preview.normalizedUrl}
        metadata={metadata}
        attached={attached}
      />
    </div>
  );
};

export default LinkPreviewMessage;
