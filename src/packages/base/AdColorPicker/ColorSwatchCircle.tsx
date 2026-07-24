import type { CSSProperties, FC } from 'react';

import type { ColorId, ColorPalette, PaletteShade } from '@/packages/color';

import { buildSwatchBackground, useResolvedPalette } from '@/packages/color';

import styles from './ColorSwatchCircle.module.css';

export type ColorSwatchCircleProps = {
  colorId?: ColorId;
  palette?: ColorPalette;
  shades?: PaletteShade[];
  size?: number;
  selected?: boolean;
  className?: string;
};

const ColorSwatchCircle: FC<ColorSwatchCircleProps> = ({
  colorId,
  palette: paletteProp,
  shades,
  size = 32,
  selected,
  className,
}) => {
  const resolved = useResolvedPalette(colorId ?? 'lavender');
  const palette = paletteProp ?? resolved;

  return (
    <span
      className={[styles.root, selected && styles.selected, className]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          width: size,
          height: size,
          background: buildSwatchBackground(palette, shades),
        } as CSSProperties
      }
      aria-hidden
    />
  );
};

export default ColorSwatchCircle;
