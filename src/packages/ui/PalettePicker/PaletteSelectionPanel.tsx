import {
  faCheck,
  faLightbulb,
  faPlus,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useMemo, type FC, type MouseEvent } from 'react';

import type { ColorId, PaletteShade } from '@/packages/color';

import { AdIcon } from '@/packages/base';
import {
  ColorSwatchCircle,
  ColorTooltip,
  PresetColorCard,
} from '@/packages/base/AdColorPicker';
import {
  getColorName,
  getPresetIds,
  isValidColorId,
  RECENT_COLOR_LIMIT,
  toCustomColorId,
} from '@/packages/color';
import { useAppStore, useDiaryStore } from '@/store';

import styles from './PaletteSelectionPanel.module.css';

export type PaletteSelectionPanelProps = {
  value: ColorId;
  onSelect: (colorId: ColorId) => void;
  onValueChange: (colorId: ColorId) => void;
  onClose: () => void;
  onCreateNew: () => void;
  hideCreateNew?: boolean;
  shades?: PaletteShade[];
};

const PaletteSelectionPanel: FC<PaletteSelectionPanelProps> = ({
  value,
  onSelect,
  onValueChange,
  onClose,
  onCreateNew,
  hideCreateNew = false,
  shades,
}) => {
  const customPalettes = useDiaryStore('customPalettes');
  const deleteCustomPalette = useDiaryStore('deleteCustomPalette');
  const removeRecentColor = useAppStore('removeRecentColor');
  const recentColors = useAppStore('colorPickerPrefs').recent;

  const presetIds = useMemo(() => getPresetIds(), []);
  const customEntries = useMemo(
    () => Object.values(customPalettes),
    [customPalettes],
  );

  const validRecentColors = useMemo(
    () => recentColors.filter((id) => isValidColorId(id, customPalettes)),
    [recentColors, customPalettes],
  );

  const recentIds = useMemo(() => {
    const maxOthers = value ? RECENT_COLOR_LIMIT - 1 : RECENT_COLOR_LIMIT;

    return validRecentColors.filter((id) => id !== value).slice(0, maxOthers);
  }, [validRecentColors, value]);

  const displayRecent = value
    ? [value, ...recentIds.filter((id) => id !== value)]
    : recentIds;
  const showCustomSection = customEntries.length > 0 || !hideCreateNew;

  const handleDeleteCustom = (
    event: MouseEvent<HTMLButtonElement>,
    paletteId: string,
    colorId: ColorId,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    deleteCustomPalette(paletteId);
    removeRecentColor(colorId);

    if (value === colorId) {
      onValueChange(presetIds[0]);
    }
  };

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Choose a color</h2>
          <p className={styles.subtitle}>Pick a preset or create your own</p>
        </div>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close color picker"
          onClick={onClose}
        >
          <AdIcon icon={faXmark} size={12} />
        </button>
      </header>

      <div className={styles.scroll}>
        {displayRecent.length > 0 ? (
          <section>
            <h3 className={styles.sectionTitle}>Recent</h3>
            <div className={styles.paletteCardGrid}>
              {displayRecent.map((colorId) => {
                const selected = value === colorId;
                const name = getColorName(colorId, customPalettes);

                return (
                  <div key={colorId} className={styles.paletteCardCell}>
                    <button
                      type="button"
                      className={styles.recentCard}
                      data-selected={selected || undefined}
                      aria-label={`Recent color ${name}`}
                      aria-pressed={selected}
                      onClick={() => onSelect(colorId)}
                    >
                      {selected ? (
                        <span className={styles.recentCheck} aria-hidden>
                          <AdIcon icon={faCheck} size={8} />
                        </span>
                      ) : null}
                      <ColorSwatchCircle
                        colorId={colorId}
                        size={32}
                        shades={shades}
                      />
                      <span className={styles.recentName}>{name}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section>
          <h3 className={styles.sectionTitle}>Preset Colors</h3>
          <div className={styles.paletteCardGrid}>
            {presetIds.map((colorId) => (
              <div key={colorId} className={styles.paletteCardCell}>
                <PresetColorCard
                  colorId={colorId}
                  selected={value === colorId}
                  onSelect={onSelect}
                  shades={shades}
                />
              </div>
            ))}
          </div>
        </section>

        {showCustomSection ? (
          <section>
            {customEntries.length > 0 ? (
              <h3 className={styles.sectionTitle}>Custom Colors</h3>
            ) : null}
            <div className={styles.paletteCardGrid}>
              {!hideCreateNew ? (
                <div className={styles.paletteCardCell}>
                  <button
                    type="button"
                    className={styles.createCard}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={onCreateNew}
                  >
                    <AdIcon icon={faPlus} size={14} />
                    <span>Create new</span>
                  </button>
                </div>
              ) : null}

              {customEntries.map((palette) => {
                const colorId = toCustomColorId(palette.id);
                const selected = value === colorId;

                return (
                  <div key={palette.id} className={styles.paletteCardCell}>
                    <ColorTooltip
                      colorId={colorId}
                      name={palette.name}
                      personality={palette.description}
                    >
                      <div className={styles.customCardWrap}>
                        <button
                          type="button"
                          className={styles.deleteBtn}
                          aria-label={`Delete ${palette.name} palette`}
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) =>
                            handleDeleteCustom(event, palette.id, colorId)
                          }
                        >
                          <AdIcon icon={faXmark} size={8} />
                        </button>
                        <button
                          type="button"
                          className={styles.customCard}
                          data-selected={selected || undefined}
                          aria-pressed={selected}
                          onClick={() => onSelect(colorId)}
                        >
                          <ColorSwatchCircle
                            colorId={colorId}
                            size={32}
                            shades={shades}
                          />
                          <span className={styles.customName}>
                            {palette.name}
                          </span>
                        </button>
                      </div>
                    </ColorTooltip>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <footer className={styles.footer}>
        <AdIcon icon={faLightbulb} size={12} />
        <span className={styles.tipHover}>
          Tip: Hover on a color to see how it looks.
        </span>
        <span className={styles.tipHold}>
          Tip: Hold on a color to see how it looks.
        </span>
      </footer>
    </div>
  );
};

export default PaletteSelectionPanel;
