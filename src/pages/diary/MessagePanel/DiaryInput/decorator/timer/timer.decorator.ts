import type { TimerDecorator } from '@/store/diary/type';

import type {
  ComposerContext,
  DecoratorDefinition,
} from '../charms/charm.types';

import { findDecoratorIndex } from '../charms/decoratorIndex';
import {
  isTimerDecorator,
  pauseTimerDecorator,
  playTimerDecorator,
  resetTimerDecorator,
} from './timer.utils';
import { createControlsCharm } from './timerControlsCharm';
import { createModeCharm } from './timerModeCharm';
import { createTimerModeCountupCharm } from './timerModeCountupCharm';
import { createTimerModeDatetimeCharm } from './timerModeDatetimeCharm';
import { createTimerModeTimerCharm } from './timerModeTimerCharm';
import { createTimerTopLayoutCharm } from './timerTopLayoutCharm';

const handleTimerEvent = (
  ctx: ComposerContext,
  decoratorIndex: number,
  action: string,
): void => {
  const decoration = ctx.decorators[decoratorIndex];
  if (!isTimerDecorator(decoration)) {
    return;
  }

  let next: TimerDecorator = decoration;

  if (action === 'play') {
    next = playTimerDecorator(decoration);
  } else if (action === 'pause') {
    next = pauseTimerDecorator(decoration);
  } else if (action === 'reset') {
    next = resetTimerDecorator(decoration);
  } else {
    return;
  }

  ctx.updateDecorator(decoratorIndex, next);
};

export const timerDecorator: DecoratorDefinition = {
  createCharms: (_decoration, decoratorIndex) => [
    createTimerTopLayoutCharm(),
    createTimerModeTimerCharm(decoratorIndex),
    createTimerModeCountupCharm(decoratorIndex),
    createTimerModeDatetimeCharm(decoratorIndex),
    createModeCharm(decoratorIndex),
    createControlsCharm(),
  ],
  handleEvent: {
    play: (ctx, decoratorIndex) =>
      handleTimerEvent(ctx, decoratorIndex, 'play'),
    pause: (ctx, decoratorIndex) =>
      handleTimerEvent(ctx, decoratorIndex, 'pause'),
    reset: (ctx, decoratorIndex) =>
      handleTimerEvent(ctx, decoratorIndex, 'reset'),
  },
};

export const handleTimerDecoratorEvent = (
  ctx: ComposerContext,
  event: { action: string },
): void => {
  const index = findDecoratorIndex(ctx.decorators, 'timer');
  if (index < 0) {
    return;
  }

  handleTimerEvent(ctx, index, event.action);
};
