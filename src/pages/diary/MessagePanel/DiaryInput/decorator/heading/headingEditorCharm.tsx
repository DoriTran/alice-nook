import type { Charm } from '../charms/charm.types';

import HeadingCharm from './HeadingCharm';

export const createHeadingCharm = (decoratorIndex: number): Charm => ({
  id: 'heading-editor',
  region: 'top',
  order: 10,
  elements: [
    {
      region: 'top',
      order: 10,
      render: (ctx) => (
        <HeadingCharm decoratorIndex={decoratorIndex} ctx={ctx} />
      ),
    },
  ],
});
