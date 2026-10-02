import type { Charm } from '../charms/charm.types';

export const createTimerTopLayoutCharm = (): Charm => ({
  id: 'timer-top-layout',
  region: 'top',
  order: 0,
  styles: [
    {
      target: 'top',
      priority: 50,
      styles: {
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: 'var(--timer-top-gap, 12px)',
        padding: 'var(--timer-top-padding, 12px 16px)',
        minHeight: 'var(--timer-top-min-height, 56px)',
        borderTopLeftRadius: 'calc(var(--radius-lg) - 1px)',
        borderTopRightRadius: 'calc(var(--radius-lg) - 1px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        background:
          'color-mix(in srgb, var(--primary-light) 30%, var(--surface))',
      },
    },
  ],
});
