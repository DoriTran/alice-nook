import { useEffect, useState } from 'react';

import type { Attachment } from '@/store/diary/type';

import { resolvePrivateAttachmentUrl } from './attachmentReadUrlCache';
import { resolveAttachmentUrl } from './resolveAttachmentUrl';

export const useAttachmentUrl = (attachment: Attachment | undefined) => {
  const legacyUrl = attachment?.url;
  const [url, setUrl] = useState(() =>
    legacyUrl ? resolveAttachmentUrl(legacyUrl, attachment?.type) : '',
  );

  useEffect(() => {
    let active = true;
    if (!attachment) {
      setUrl('');
    } else if (legacyUrl) {
      setUrl(resolveAttachmentUrl(legacyUrl, attachment.type));
    } else {
      setUrl('');
      void resolvePrivateAttachmentUrl(attachment.id)
        .then((next) => {
          if (active) setUrl(next);
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, [attachment, legacyUrl]);

  return url;
};
