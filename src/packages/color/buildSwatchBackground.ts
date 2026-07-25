import type { ColorPalette, PaletteShade } from './types';

/**
 * Default matches the classic swatch when read counterclockwise from 12 o'clock:
 * strong → main → soft (same visual as the old soft/main/strong clockwise layout).
 */
const DEFAULT_SHADES: PaletteShade[] = ['strong', 'main', 'soft'];

export const normalizeShades = (shades?: PaletteShade[]): PaletteShade[] => {
  if (!shades || shades.length === 0) {
    return DEFAULT_SHADES;
  }

  return shades;
};

/**
 * Builds a CSS background for the palette swatch circle.
 * - 1 shade → solid fill
 * - 2+ shades → conic-gradient starting at 12 o'clock; prop order is
 *   counterclockwise, so stops are reversed for CSS's clockwise gradient
 */
export const buildSwatchBackground = (
  palette: ColorPalette,
  shades?: PaletteShade[],
): string => {
  const resolved = normalizeShades(shades);

  if (resolved.length === 1) {
    return palette[resolved[0]];
  }

  // Prop order is counterclockwise from 12 o'clock; CSS conic-gradient is clockwise.
  const clockwise = [...resolved].reverse();
  const arc = 360 / clockwise.length;
  const stops = clockwise
    .map((shade, index) => {
      const start = index * arc;
      const end = (index + 1) * arc;
      return `${palette[shade]} ${start}deg ${end}deg`;
    })
    .join(', ');

  return `conic-gradient(from 0deg, ${stops})`;
};
