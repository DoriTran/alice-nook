import type { FC } from 'react';

import { faCalendar, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';

import type { TimerDecorator } from '@/store/diary/type';

import { AdDateTimePicker, AdIcon } from '@/packages/base';

import type { ComposerContext } from '../charms/charm.types';

import {
  formatDatetimeCountdown,
  formatDatetimeDisplayParts,
  getTimerRemainingMs,
} from './timer.utils';
import styles from './timerCharms.module.css';
import TimerDisplayText from './TimerDisplayText';
import { useTimerNow } from './useTimerNow';

type TimerModeDatetimeProps = {
  decoration: TimerDecorator;
  decoratorIndex: number;
  ctx: ComposerContext;
};

const TimerModeDatetime: FC<TimerModeDatetimeProps> = ({
  decoration,
  decoratorIndex,
  ctx,
}) => {
  const timer = decoration;
  const now = useTimerNow(
    !ctx.composing && timer.running && !!timer.deadlineAt,
  );
  const { composing, updateDecorator } = ctx;

  const update = (next: TimerDecorator) => {
    updateDecorator(decoratorIndex, next);
  };

  if (composing) {
    return (
      <div className={styles.modePanel}>
        <AdIcon icon={faCalendar} size={24} />
        <AdDateTimePicker
          compact
          className={styles.composerPill}
          value={timer.targetDate}
          onChange={(value) => {
            if (!value) {
              return;
            }

            update({
              ...timer,
              targetDate: new Date(value).toISOString(),
            });
          }}
        />
      </div>
    );
  }

  const remainingMs = getTimerRemainingMs(timer, now);
  const reached = remainingMs <= 0;
  const display = formatDatetimeDisplayParts(timer.targetDate);

  return (
    <div className={styles.modePanel}>
      <AdIcon icon={reached ? faCalendarCheck : faCalendar} size={28} />
      <div className={styles.datetimeStack}>
        <span className={`${styles.displayText} ${styles.datetimeDisplay}`}>
          <span className={styles.datetimePart}>{display.date}</span>
          <span className={styles.datetimePart}>{display.time}</span>
        </span>
        <TimerDisplayText
          text={formatDatetimeCountdown(remainingMs)}
          className={styles.datetimeCountdown}
        />
      </div>
    </div>
  );
};

export default TimerModeDatetime;
