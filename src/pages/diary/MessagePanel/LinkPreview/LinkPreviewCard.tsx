import { Link2 } from 'lucide-react';
import { useEffect, useState, type FC } from 'react';

import type { LinkPreviewMetadata } from '@/store/diary/type';

import { AdIcon } from '@/packages/base';

import styles from './LinkPreviewCard.module.css';
import {
  getLinkPreviewHostname,
  safeRemoteImage,
} from './linkPreviewPresentation.utils';

export type LinkPreviewCardProps = {
  url: string;
  metadata?: LinkPreviewMetadata;
  composer?: boolean;
  interactive?: boolean;
  attached?: boolean;
  followed?: boolean;
};

const LinkPreviewCard: FC<LinkPreviewCardProps> = ({
  url,
  metadata,
  composer = false,
  interactive = true,
  attached = false,
  followed = false,
}) => {
  const imageUrl = safeRemoteImage(metadata?.imageUrl);
  const faviconUrl = safeRemoteImage(metadata?.faviconUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  useEffect(() => setImageFailed(false), [imageUrl]);
  useEffect(() => setFaviconFailed(false), [faviconUrl]);

  const hostname = getLinkPreviewHostname(url, metadata);

  return (
    <a
      className={`${styles.card} ${composer ? styles.composer : ''} ${attached ? styles.attached : ''} ${followed ? styles.followed : ''}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={interactive ? undefined : -1}
      aria-hidden={interactive ? undefined : true}
    >
      {imageUrl && !imageFailed ? (
        <img
          className={styles.image}
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : null}
      <span className={styles.body}>
        <span className={styles.domain}>
          {faviconUrl && !faviconFailed ? (
            <img
              className={styles.favicon}
              src={faviconUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <AdIcon icon={Link2} source="lucide" size={12} />
          )}
          {metadata?.siteName ?? hostname}
        </span>
        <span className={styles.title}>{metadata?.title ?? hostname}</span>
        {metadata?.description ? (
          <span className={styles.description}>{metadata.description}</span>
        ) : null}
      </span>
    </a>
  );
};

export default LinkPreviewCard;
