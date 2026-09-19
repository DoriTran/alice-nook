import type { FC } from 'react';

import { faAlarmClock } from '@fortawesome/free-solid-svg-icons';

import type { TimerDecorator } from '@/store/diary/type';

import { AdDurationPicker, AdIcon } from '@/packages/base';

import type { ComposerContext } from '../charms/charm.types';

import { getTimerDisplayText } from './timer.utils';
import styles from './timerCharms.module.css';
import TimerDisplayText from './TimerDisplayText';
import { useTimerNow } from './useTimerNow';

type TimerModeTimerProps = {
  decoration: TimerDecorator;
  decoratorIndex: number;
  ctx: ComposerContext;
};

const TimerModeTimer: FC<TimerModeTimerProps> = ({
  decoration,
  decoratorIndex,
  ctx,
}) => {
  const timer = decoration;
  const now = useTimerNow(!ctx.composing && timer.running && !timer.pause);
  const { composing, updateDecorator } = ctx;

  const update = (next: TimerDecorator) => {
    updateDecorator(decoratorIndex, next);
  };

  if (composing) {
    return (
      <div className={styles.modePanel}>
        <AdIcon icon={faAlarmClock} size={24} />
        <AdDurationPicker
          className={styles.composerPill}
          compact
          valueMs={timer.durationMs}
          onChange={(durationMs) => {
            update({ ...timer, durationMs, initialDurationMs: durationMs });
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.modePanel}>
      <AdIcon icon={faAlarmClock} size={28} />
      <TimerDisplayText text={getTimerDisplayText(timer, now)} />
    </div>
  );
};

export default TimerModeTimer;
