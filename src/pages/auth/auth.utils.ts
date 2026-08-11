import type { AdriftDecoration } from '@/packages/ui/AdriftBackground';

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

export function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('pickRandom: empty list');
  }
  return items[randomInt(0, items.length - 1)];
}

/**
 * Random size in [min, max] skewed toward smaller values.
 * Higher `power` = rarer large sizes (default 2.5).
 */
export function randomSizeSkewed(
  min: number,
  max: number,
  power = 2.5,
): number {
  return min + (max - min) * Math.pow(Math.random(), power);
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    const a = items[i];
    const b = items[j];
    if (a === undefined || b === undefined) continue;
    items[i] = b;
    items[j] = a;
  }
  return items;
}

export function shuffle<T>(items: readonly T[]): T[] {
  return shuffleInPlace([...items]);
}

/**
 * Pick `count` decorations from `pool`.
 * - count <= pool: unique random subset
 * - count > pool: every asset at least once, then fill with duplicates
 */
export function pickDecorationSet(
  pool: readonly string[],
  count: number,
): string[] {
  if (pool.length === 0 || count <= 0) return [];

  if (count <= pool.length) {
    return shuffle(pool).slice(0, count);
  }

  const guaranteed = shuffle(pool);
  const extras: string[] = [];
  for (let i = 0; i < count - pool.length; i += 1) {
    extras.push(pickRandom(pool));
  }
  return shuffle([...guaranteed, ...extras]);
}

export function buildAdriftDecorations(
  pool: readonly string[],
  count: number,
): AdriftDecoration[] {
  return pickDecorationSet(pool, count).map((asset) => {
    const travelDuration = randomBetween(30, 80);

    return {
      asset,
      // Spawn near / slightly above the top so pieces enter then drift down-right.
      top: randomBetween(-8, 28),
      size: randomSizeSkewed(20, 100),
      angle: randomBetween(8, 22),
      travelDuration,
      travelDelay: -randomBetween(0, travelDuration),
      float: randomBetween(4, 10),
      drift: randomBetween(8, 18),
      rotate: randomBetween(1, 4),
      scale: randomBetween(1, 1.05),
      floatDuration: randomBetween(4, 9),
      opacity: randomBetween(0.18, 0.4),
      blur: randomBetween(0, 0.6),
    };
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
