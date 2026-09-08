import { useEffect, useState, type FC } from 'react';
import { createPortal } from 'react-dom';

import type { LinkPreviewMetadata } from '@/store/diary/type';

import { resolveLinkPreview } from '@/api';

import LinkPreviewCard from './LinkPreviewCard';
import styles from './LinkPreviewPopover.module.css';

export type LinkPreviewPopoverProps = {
  url: string;
  anchorRect: DOMRect;
  dismissOnBackdrop?: boolean;
  onDismiss?: () => void;
};

const LinkPreviewPopover: FC<LinkPreviewPopoverProps> = ({
  url,
  anchorRect,
  dismissOnBackdrop = false,
  onDismiss,
}) => {
  const [metadata, setMetadata] = useState<LinkPreviewMetadata>();

  useEffect(() => {
    let stale = false;
    void resolveLinkPreview(url)
      .then((next) => {
        if (!stale) setMetadata(next);
      })
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [url]);

  const width = Math.min(448, window.innerWidth - 24);
  const centeredLeft = anchorRect.left + anchorRect.width / 2 - width / 2;
  const left = Math.max(
    12,
    Math.min(centeredLeft, window.innerWidth - width - 12),
  );
  const placeAbove = anchorRect.top > 180;

  return createPortal(
    <>
      {dismissOnBackdrop ? (
        <div
          className={styles.dismissBackdrop}
          aria-hidden
          onPointerDown={(event) => {
            event.preventDefault();
            onDismiss?.();
          }}
        />
      ) : null}
      <div
        className={styles.popover}
        style={{
          width,
          left,
          top: placeAbove ? anchorRect.top - 8 : anchorRect.bottom + 8,
          transform: placeAbove ? 'translateY(-100%)' : undefined,
        }}
        role="tooltip"
      >
        <LinkPreviewCard url={url} metadata={metadata} interactive={false} />
      </div>
    </>,
    document.body,
  );
};

export default LinkPreviewPopover;
