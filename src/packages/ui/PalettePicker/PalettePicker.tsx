import { useState, type FC } from 'react';

import type { ColorId, PaletteShade } from '@/packages/color';

import { AdPopover, type AdPopoverProps } from '@/packages/base';
import { ColorSwatchCircle } from '@/packages/base/AdColorPicker';
import fieldStyles from '@/packages/base/formField/formField.module.css';
import { pickerTriggerClassNames } from '@/packages/base/formField/pickerTriggerClassNames';
import { getColorName } from '@/packages/color';
import { useAppStore, useDiaryStore } from '@/store';

import PalettePickerPopover from './PalettePickerPopover';

export type PalettePickerProps = {
  value: ColorId;
  onChange: (value: ColorId) => void;
  label?: string;
  variant?: 'popover' | 'compact';
  offset?: AdPopoverProps['offset'];
  /** Which palette shades to show in swatches. Empty/omitted = all three. */
  shades?: PaletteShade[];
  /** Force narrow layout: create panel hidden until "Create new". */
  stacked?: boolean;
  /** Controlled open state. */
  opened?: boolean;
  onOpenChange?: (opened: boolean) => void;
  /** Swatch diameter in px. Defaults: compact 26, popover 28. */
  swatchSize?: number;
};

const COMPACT_SWATCH_SIZE = 26;
const DEFAULT_SWATCH_SIZE = 28;

const PalettePicker: FC<PalettePickerProps> = ({
  value,
  onChange,
  label = 'Color',
  variant = 'popover',
  offset,
  shades,
  stacked = false,
  opened,
  onOpenChange,
  swatchSize,
}) => {
  const customPalettes = useDiaryStore('customPalettes');
  const addRecentColor = useAppStore('addRecentColor');
  const [uncontrolledOpened, setUncontrolledOpened] = useState(false);

  const isControlled = opened !== undefined;
  const isOpen = isControlled ? opened : uncontrolledOpened;
  const setIsOpen = onOpenChange ?? setUncontrolledOpened;

  const displayName = getColorName(value, customPalettes);
  const isCompact = variant === 'compact';
  const resolvedSwatchSize =
    swatchSize ?? (isCompact ? COMPACT_SWATCH_SIZE : DEFAULT_SWATCH_SIZE);

  const handleChange = (next: ColorId) => {
    onChange(next);
    addRecentColor(next);
    setIsOpen(false);
  };

  const handleValueChange = (next: ColorId) => {
    onChange(next);
  };

  const trigger = (
    <button
      type="button"
      className={pickerTriggerClassNames({
        variant,
        opened: isOpen,
      })}
      style={
        swatchSize != null
          ? {
              width: resolvedSwatchSize + 4,
              height: resolvedSwatchSize + 4,
            }
          : undefined
      }
      aria-label={`Selected color: ${displayName}`}
      aria-expanded={isOpen}
      onClick={() => setIsOpen(!isOpen)}
    >
      <ColorSwatchCircle
        colorId={value}
        size={resolvedSwatchSize}
        shades={shades}
      />
    </button>
  );

  return (
    <div className={fieldStyles.field} data-palette-picker>
      {label ? <span className={fieldStyles.label}>{label}</span> : null}
      <AdPopover
        opened={isOpen}
        onChange={setIsOpen}
        position="bottom-start"
        preventPositionChangeWhenVisible
        offset={offset}
        width="max-content"
        shadow="md"
        radius="lg"
        styles={{
          dropdown: {
            padding: 0,
            maxWidth: 'calc(100vw - 2rem)',
            width: 'max-content',
          },
        }}
        anchor={trigger}
      >
        <PalettePickerPopover
          value={value}
          onChange={handleChange}
          onValueChange={handleValueChange}
          onClose={() => setIsOpen(false)}
          shades={shades}
          stacked={stacked}
        />
      </AdPopover>
    </div>
  );
};

export default PalettePicker;
