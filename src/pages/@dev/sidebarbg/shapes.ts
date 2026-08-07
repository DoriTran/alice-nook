export type DecorationShape = 'sparkle' | 'dot' | 'flower';

const svgDataUri = (svg: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** 4-point sparkle scaled to `size` (matches LeftPanel's 6px path when size=6). */
const sparklePath = (size: number): string => {
  const m = size / 2;
  const i = size / 6;
  const o = size / 3;
  return `M${m} 0 ${m + i} ${o} ${size} ${m} ${m + i} ${size - o} ${m} ${size} ${m - i} ${size - o} 0 ${m} ${m - i} ${o}Z`;
};

/**
 * Build a tile SVG (`spacing`×`spacing`) with a `size` decoration at the
 * top-left corner so `mask-size` does not stretch the shape.
 */
const tileSvg = (shape: DecorationShape, size: number, spacing: number): string => {
  const s = Math.max(2, Math.round(size));
  const tile = Math.max(s, Math.round(spacing));
  let mark: string;

  if (shape === 'dot') {
    const r = s / 2;
    mark = `<circle cx="${r}" cy="${r}" r="${r}" fill="%23000"/>`.replace(
      '%23000',
      '#000',
    );
  } else if (shape === 'flower') {
    const r = s / 4;
    const mid = s / 2;
    mark = [
      `<circle cx="${mid}" cy="${r}" r="${r}" fill="#000"/>`,
      `<circle cx="${s - r}" cy="${mid}" r="${r}" fill="#000"/>`,
      `<circle cx="${mid}" cy="${s - r}" r="${r}" fill="#000"/>`,
      `<circle cx="${r}" cy="${mid}" r="${r}" fill="#000"/>`,
    ].join('');
  } else {
    mark = `<path d="${sparklePath(s)}" fill="#000"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">${mark}</svg>`;
};

/**
 * Two-layer `mask-image` value (same URI twice) for honeycomb offset via
 * `mask-position`. Spacing is baked into the SVG tile so mask-size won't
 * stretch the decoration.
 */
export const maskImageForShape = (
  shape: DecorationShape,
  size: number,
  spacing: number,
): string => {
  const uri = svgDataUri(tileSvg(shape, size, spacing));
  return `${uri}, ${uri}`;
};

/** Single data-URI (for the generated CSS output block). */
export const maskUriForShape = (
  shape: DecorationShape,
  size: number,
  spacing: number,
): string => svgDataUri(tileSvg(shape, size, spacing));
