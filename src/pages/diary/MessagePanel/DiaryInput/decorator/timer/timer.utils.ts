import type {
  MessageDecorator,
  TimerDecorator,
  TimerMode,
} from '@/store/diary/type';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

export const DEFAULT_TIMER_DURATION_MS = 25 * 60 * 1000;

export type DurationParts = {
  days: number;
  time: string;
};

export const defaultTimerTargetDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
};

export const createDefaultTimerDecorator = (): TimerDecorator => ({
  type: 'timer',
  mode: 'timer',
  pause: false,
  running: false,
  durationMs: DEFAULT_TIMER_DURATION_MS,
  initialDurationMs: DEFAULT_TIMER_DURATION_MS,
  startedAt: null,
  targetDate: defaultTimerTargetDate(),
  deadlineAt: null,
  alertedAt: null,
});

export const isTimerDecorator = (
  decoration: MessageDecorator,
): decoration is TimerDecorator => decoration.type === 'timer';

export const durationMsToParts = (ms: number): DurationParts => {
  const totalSeconds = Math.max(0, Math.floor(ms / SECOND_MS));
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const remainder = totalSeconds % (24 * 60 * 60);
  const hours = Math.floor(remainder / 3600);
  const minutes = Math.floor((remainder % 3600) / 60);
  const seconds = remainder % 60;

  const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { days, time };
};

export const partsToDurationMs = ({ days, time }: DurationParts): number => {
  const segments = time.split(':').map((part) => Number(part) || 0);
  const hours = segments[0] ?? 0;
  const minutes = segments[1] ?? 0;
  const seconds = segments[2] ?? 0;

  return (
    days * DAY_MS + hours * HOUR_MS + minutes * MINUTE_MS + seconds * SECOND_MS
  );
};

export const formatTimerDisplay = (ms: number): string => {
  const safeMs = Math.max(0, ms);
  const parts = durationMsToParts(safeMs);

  if (parts.days > 0) {
    return `${parts.days}d ${parts.time}`;
  }

  const segments = parts.time.split(':');
  const hours = Number(segments[0]) || 0;
  const minutes = Number(segments[1]) || 0;
  const seconds = Number(segments[2]) || 0;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export const formatCountupDisplay = (elapsedMs: number): string => {
  const safeMs = Math.max(0, elapsedMs);
  const parts = durationMsToParts(safeMs);
  const segments = parts.time.split(':');
  const hours = Number(segments[0]) || 0;
  const minutes = Number(segments[1]) || 0;
  const seconds = Number(segments[2]) || 0;

  const chunks: string[] = [];

  if (parts.days > 0) {
    chunks.push(`${parts.days}d`);
  }

  if (parts.days > 0 || hours > 0) {
    chunks.push(String(hours).padStart(2, '0'));
  }

  if (parts.days > 0 || hours > 0 || minutes > 0) {
    chunks.push(String(minutes).padStart(2, '0'));
  }

  chunks.push(String(seconds).padStart(2, '0'));

  return chunks.join(parts.days > 0 || hours > 0 ? ' ' : ':');
};

export const getTimerRemainingMs = (
  decoration: TimerDecorator,
  now = Date.now(),
): number => {
  if (decoration.mode === 'countup') {
    if (decoration.running && decoration.startedAt && !decoration.pause) {
      return Math.max(0, now - new Date(decoration.startedAt).getTime());
    }

    return decoration.durationMs;
  }

  if (decoration.mode === 'datetime') {
    return Math.max(0, new Date(decoration.targetDate).getTime() - now);
  }

  if (decoration.running && decoration.deadlineAt && !decoration.pause) {
    return Math.max(0, new Date(decoration.deadlineAt).getTime() - now);
  }

  return decoration.durationMs;
};

export const getTimerDisplayText = (
  decoration: TimerDecorator,
  now = Date.now(),
): string => {
  if (decoration.mode === 'countup') {
    return formatCountupDisplay(getTimerRemainingMs(decoration, now));
  }

  if (decoration.mode === 'datetime' && !decoration.running) {
    return formatDatetimeDisplay(decoration.targetDate);
  }

  return formatTimerDisplay(getTimerRemainingMs(decoration, now));
};

export const tickTimerDecorator = (
  decoration: TimerDecorator,
  now: number,
): TimerDecorator => {
  const remaining = getTimerRemainingMs(decoration, now);
  const nextDurationMs = Math.floor(remaining / SECOND_MS) * SECOND_MS;
  const prevDurationMs =
    Math.floor(decoration.durationMs / SECOND_MS) * SECOND_MS;

  if (decoration.mode === 'countup') {
    if (nextDurationMs === prevDurationMs) {
      return decoration;
    }

    return { ...decoration, durationMs: remaining };
  }

  const nextRunning = remaining > 0 ? decoration.running : false;
  const nextPause = remaining <= 0 ? true : decoration.pause;

  if (
    nextDurationMs === prevDurationMs &&
    nextRunning === decoration.running &&
    nextPause === decoration.pause
  ) {
    return decoration;
  }

  return {
    ...decoration,
    durationMs: remaining,
    running: nextRunning,
    pause: nextPause,
  };
};

export const playTimerDecorator = (
  decoration: TimerDecorator,
  now = Date.now(),
): TimerDecorator => {
  if (decoration.mode === 'countup') {
    const elapsed = decoration.pause ? decoration.durationMs : 0;
    return {
      ...decoration,
      running: true,
      pause: false,
      startedAt: new Date(now - elapsed).toISOString(),
      alertedAt: null,
    };
  }

  if (decoration.mode === 'datetime') {
    return {
      ...decoration,
      running: true,
      pause: false,
      deadlineAt: decoration.targetDate,
      alertedAt: null,
    };
  }

  return {
    ...decoration,
    running: true,
    pause: false,
    deadlineAt: new Date(now + decoration.durationMs).toISOString(),
    alertedAt: null,
  };
};

export const pauseTimerDecorator = (
  decoration: TimerDecorator,
  now = Date.now(),
): TimerDecorator => {
  const remaining = getTimerRemainingMs(decoration, now);

  return {
    ...decoration,
    running: false,
    pause: true,
    durationMs: remaining,
    deadlineAt: null,
  };
};

export const resetTimerDecorator = (
  decoration: TimerDecorator,
): TimerDecorator => {
  if (decoration.mode === 'countup') {
    return {
      ...decoration,
      running: false,
      pause: false,
      durationMs: 0,
      startedAt: null,
      alertedAt: null,
    };
  }

  if (decoration.mode === 'datetime') {
    return {
      ...decoration,
      running: false,
      pause: false,
      durationMs: Math.max(
        0,
        new Date(decoration.targetDate).getTime() - Date.now(),
      ),
      deadlineAt: null,
      alertedAt: null,
    };
  }

  return {
    ...decoration,
    running: false,
    pause: false,
    durationMs: decoration.initialDurationMs ?? DEFAULT_TIMER_DURATION_MS,
    deadlineAt: null,
    alertedAt: null,
  };
};

export const setTimerMode = (
  decoration: TimerDecorator,
  mode: TimerMode,
): TimerDecorator => {
  const base = resetTimerDecorator({ ...decoration, mode });

  if (mode === 'datetime') {
    return {
      ...base,
      targetDate: decoration.targetDate || defaultTimerTargetDate(),
      durationMs: Math.max(
        0,
        new Date(decoration.targetDate || defaultTimerTargetDate()).getTime() -
          Date.now(),
      ),
    };
  }

  if (mode === 'countup') {
    return {
      ...base,
      durationMs: 0,
      startedAt: null,
    };
  }

  const timerDurationMs =
    decoration.initialDurationMs ||
    decoration.durationMs ||
    DEFAULT_TIMER_DURATION_MS;

  return {
    ...base,
    durationMs: timerDurationMs,
    initialDurationMs: timerDurationMs,
  };
};

export const formatDatetimeDisplay = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** Always `Xd HH:MM:SS`, including `0d` under one day. */
export const formatDatetimeCountdown = (ms: number): string => {
  const parts = durationMsToParts(Math.max(0, ms));
  return `${parts.days}d ${parts.time}`;
};
