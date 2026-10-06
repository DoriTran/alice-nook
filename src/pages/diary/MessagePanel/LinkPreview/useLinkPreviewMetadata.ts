import { useEffect, useState } from 'react';

import type { LinkPreviewMetadata } from '@/store/diary/type';

import { resolveLinkPreview } from '@/api';

export const useLinkPreviewMetadata = (url: string, disabled = false) => {
  const [metadata, setMetadata] = useState<LinkPreviewMetadata>();

  useEffect(() => {
    setMetadata(undefined);
    if (disabled) return;

    let stale = false;
    void resolveLinkPreview(url)
      .then((next) => {
        if (!stale) setMetadata(next);
      })
      .catch(() => undefined);

    return () => {
      stale = true;
    };
  }, [disabled, url]);

  return metadata;
};
