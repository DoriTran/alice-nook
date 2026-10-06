import type { FC } from 'react';

import { X } from 'lucide-react';

import { AdIcon } from '@/packages/base';

import LinkPreviewCard from './LinkPreviewCard';
import styles from './LinkPreviewMessage.module.css';
import { useLinkPreviewMetadata } from './useLinkPreviewMetadata';

export type LinkPreviewMessageProps = {
  url: string;
  attached?: boolean;
  followed?: boolean;
  disabled?: boolean;
  composer?: boolean;
  onDisablePreview?: () => void;
};

const LinkPreviewMessage: FC<LinkPreviewMessageProps> = ({
  url,
  attached = false,
  followed = false,
  disabled = false,
  composer = false,
  onDisablePreview,
}) => {
  const metadata = useLinkPreviewMetadata(url, disabled);

  return (
    <div className={`${styles.root} ${attached ? styles.attached : ''}`}>
      <LinkPreviewCard
        url={url}
        metadata={metadata}
        attached={attached}
        followed={followed}
        composer={composer}
      />
      {composer && onDisablePreview ? (
        <button
          type="button"
          className={styles.dismiss}
          aria-label="Hide link preview"
          onClick={onDisablePreview}
        >
          <AdIcon icon={X} source="lucide" size={14} />
        </button>
      ) : null}
    </div>
  );
};

export default LinkPreviewMessage;
