import type { Charm } from '../charms/charm.types';

export const createHeadingTopLayoutCharm = (): Charm => ({
  id: 'heading-top-layout',
  region: 'top',
  order: 9,
  styles: [
    {
      target: 'top',
      priority: 40,
      styles: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        borderTopLeftRadius: 'calc(var(--radius-lg) - 1px)',
        borderTopRightRadius: 'calc(var(--radius-lg) - 1px)',
        borderBottom: '1px solid var(--border-soft)',
        background:
          'color-mix(in srgb, var(--primary-light) 22%, var(--surface))',
      },
    },
    {
      target: 'top',
      priority: 60,
      styles: { flexWrap: 'wrap' },
    },
  ],
});
