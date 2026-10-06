import { Link2, X } from 'lucide-react';
import { useEffect, useState, type FC } from 'react';

import { AdIcon } from '@/packages/base';

import {
  getLinkPreviewHostname,
  safeRemoteImage,
} from './linkPreviewPresentation.utils';
import styles from './LinkPreviewTray.module.css';
import { useLinkPreviewMetadata } from './useLinkPreviewMetadata';

type Props = {
  url: string;
  disabled?: boolean;
  onDisablePreview?: () => void;
};

const CompactLinkPreviewItem: FC<Props> = ({
  url,
  disabled = false,
  onDisablePreview,
}) => {
  const metadata = useLinkPreviewMetadata(url, disabled);
  const imageUrl = safeRemoteImage(metadata?.imageUrl);
  const faviconUrl = safeRemoteImage(metadata?.faviconUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const [faviconFailed, setFaviconFailed] = useState(false);

  useEffect(() => setImageFailed(false), [imageUrl]);
  useEffect(() => setFaviconFailed(false), [faviconUrl]);

  const hostname = getLinkPreviewHostname(url, metadata);
  const siteName = metadata?.siteName ?? hostname;
  const title = metadata?.title ?? hostname;

  return (
    <div className={styles.itemWrapper}>
      <a
        className={styles.item}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className={styles.thumbnail}>
          {imageUrl && !imageFailed ? (
            <img
              className={styles.thumbnailImage}
              src={imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setImageFailed(true)}
            />
          ) : faviconUrl && !faviconFailed ? (
            <img
              className={styles.thumbnailFavicon}
              src={faviconUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFaviconFailed(true)}
            />
          ) : (
            <AdIcon icon={Link2} source="lucide" size={18} />
          )}
        </span>
        <span className={styles.itemBody}>
          <span className={styles.domain}>{siteName}</span>
          <span className={styles.itemTitle}>{title}</span>
        </span>
      </a>
      {onDisablePreview ? (
        <button
          type="button"
          className={styles.dismiss}
          aria-label="Hide link preview"
          onClick={onDisablePreview}
        >
          <AdIcon icon={X} source="lucide" size={13} />
        </button>
      ) : null}
    </div>
  );
};

export default CompactLinkPreviewItem;
