import type { FC } from 'react';

import { faCheck } from '@fortawesome/free-solid-svg-icons';

import type { ColorDefinition, ColorId, PaletteShade } from '@/packages/color';

import { AdIcon } from '@/packages/base';
import { getPreset } from '@/packages/color';

import ColorSwatchCircle from './ColorSwatchCircle';
import ColorTooltip from './ColorTooltip';
import styles from './PresetColorCard.module.css';

export type PresetColorCardProps = {
  colorId: ColorId;
  selected: boolean;
  onSelect: (colorId: ColorId) => void;
  shades?: PaletteShade[];
};

const PresetColorCard: FC<PresetColorCardProps> = ({
  colorId,
  selected,
  onSelect,
  shades,
}) => {
  const preset = getPreset(colorId as ColorDefinition['id']);

  return (
    <ColorTooltip colorId={colorId} preset={preset} name={preset.name}>
      <button
        type="button"
        className={styles.root}
        data-selected={selected || undefined}
        aria-pressed={selected}
        aria-label={`${preset.name} color`}
        onClick={() => onSelect(colorId)}
      >
        {selected ? (
          <span className={styles.check} aria-hidden>
            <AdIcon icon={faCheck} size={8} />
          </span>
        ) : null}
        <ColorSwatchCircle colorId={colorId} size={32} shades={shades} />
        <span className={styles.name}>{preset.name}</span>
      </button>
    </ColorTooltip>
  );
};

export default PresetColorCard;
