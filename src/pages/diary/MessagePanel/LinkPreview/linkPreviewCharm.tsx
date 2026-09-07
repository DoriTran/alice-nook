import type { Charm } from '../DiaryInput/decorator/charms/charm.types';

import LinkPreviewCard from './LinkPreviewCard';

export const createLinkPreviewCharm = (): Charm => ({
  id: 'system-link-preview',
  region: 'bottom',
  order: 100,
  placement: 'outside',
  styles: [
    {
      target: 'bottom',
      priority: 50,
      styles: {
        width: '100%',
        minWidth: 0,
      },
    },
  ],
  elements: [
    {
      region: 'bottom',
      order: 100,
      render: (ctx) => {
        const preview = ctx.draft.linkPreview;
        if (!ctx.composing || !preview?.enabled) return null;
        return (
          <LinkPreviewCard
            url={preview.normalizedUrl}
            metadata={preview.metadata}
            composer
            attached
          />
        );
      },
    },
  ],
});
