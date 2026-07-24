import { faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import { AdColorPicker, AdIcon, AdInput, AdTextarea } from '@/packages/base';
import {
  generatePaletteFromBase,
  normalizeShades,
  type ColorId,
  type ColorPalette,
  type PaletteShade,
} from '@/packages/color';
import { useAppStore, useDiaryStore } from '@/store';

import styles from './CreatePalettePanel.module.css';
import PaletteChatboxPreview from './PaletteChatboxPreview';

const NAME_MAX = 20;
const DESCRIPTION_MAX = 40;
const DEFAULT_BASE = '#B69DF7';
const NAME_PLACEHOLDER = 'Lavender Dream';
const DESCRIPTION_PLACEHOLDER = 'Soft & dreamy';

export type CreatePalettePanelProps = {
  onCancel: () => void;
  onSaved: (colorId: ColorId) => void;
  showBack?: boolean;
  /** Which shade inputs to show, in order. Empty/omitted = all three (default order). */
  shades?: PaletteShade[];
};

const CreatePalettePanel: FC<CreatePalettePanelProps> = ({
  onCancel,
  onSaved,
  showBack = false,
  shades,
}) => {
  const createCustomPalette = useDiaryStore('createCustomPalette');
  const addRecentColor = useAppStore('addRecentColor');

  const [baseColor, setBaseColor] = useState(DEFAULT_BASE);
  const [lightPalette, setLightPalette] = useState<ColorPalette>(
    () => generatePaletteFromBase(DEFAULT_BASE).light,
  );
  const [paletteName, setPaletteName] = useState('');
  const [description, setDescription] = useState('');

  const generated = useMemo(
    () => generatePaletteFromBase(baseColor),
    [baseColor],
  );

  // Per-shade manual edits apply to light palette; reset when base color changes.
  useEffect(() => {
    setLightPalette(generated.light);
  }, [generated.light]);

  const handleBaseChange = useCallback((hex: string) => {
    setBaseColor(hex);
  }, []);

  const handleShadeChange = useCallback(
    (shade: keyof ColorPalette, hex: string) => {
      setLightPalette((current) => ({
        ...current,
        [shade]: hex,
      }));
    },
    [],
  );

  const buildPalettePayload = useCallback(() => {
    const trimmedName = paletteName.trim();

    if (!trimmedName) {
      return null;
    }

    return {
      name: trimmedName,
      description: description.trim() || undefined,
      baseColor,
      light: lightPalette,
      dark: generated.dark,
    };
  }, [baseColor, description, generated.dark, lightPalette, paletteName]);

  const handleCreate = () => {
    const payload = buildPalettePayload();

    if (!payload) {
      return;
    }

    createCustomPalette(payload);
    setPaletteName('');
    setDescription('');
  };

  const handleSave = () => {
    const payload = buildPalettePayload();

    if (!payload) {
      return;
    }

    const colorId = createCustomPalette(payload);

    addRecentColor(colorId);
    onSaved(colorId);
  };

  const canSave = paletteName.trim().length > 0;
  const visibleShades = useMemo(() => normalizeShades(shades), [shades]);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        {showBack ? (
          <button
            type="button"
            className={styles.backBtn}
            aria-label="Back to palette list"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={onCancel}
          >
            <AdIcon icon={faArrowLeft} size={12} />
          </button>
        ) : null}
        <h2 className={styles.title}>Create Custom Palette</h2>
      </header>

      <div className={styles.scroll}>
        <div className={styles.topRow}>
          <div className={styles.pickerColumn}>
            <span className={styles.blockTitle}>Color</span>
            <AdColorPicker
              exposed
              value={baseColor}
              onChange={handleBaseChange}
            />
          </div>

          <div className={styles.metaColumn}>
            <div className={styles.nameField}>
              <div className={styles.fieldMeta}>
                <span className={styles.fieldLabel}>Name</span>
                <span className={styles.charCount}>
                  {paletteName.length}/{NAME_MAX}
                </span>
              </div>
              <AdInput
                value={paletteName}
                maxLength={NAME_MAX}
                placeholder={NAME_PLACEHOLDER}
                onChange={(event) => setPaletteName(event.target.value)}
              />
            </div>

            <div className={styles.descriptionField}>
              <div className={styles.fieldMeta}>
                <span className={styles.fieldLabel}>
                  Description (optional)
                </span>
                <span className={styles.charCount}>
                  {description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
              <div className={styles.descriptionInputWrap}>
                <AdTextarea
                  className={styles.descriptionInput}
                  value={description}
                  maxLength={DESCRIPTION_MAX}
                  placeholder={DESCRIPTION_PLACEHOLDER}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={styles.shades}
          style={{
            gridTemplateColumns: `repeat(${visibleShades.length}, minmax(0, 1fr))`,
          }}
        >
          {visibleShades.map((shade) => (
            <AdColorPicker
              key={shade}
              label={shade.charAt(0).toUpperCase() + shade.slice(1)}
              value={lightPalette[shade]}
              onChange={(hex) => handleShadeChange(shade, hex)}
            />
          ))}
        </div>

        <div className={styles.previewSection}>
          <span className={styles.blockTitle}>Preview</span>
          <PaletteChatboxPreview
            name={paletteName}
            namePlaceholder={NAME_PLACEHOLDER}
            description={description}
            descriptionPlaceholder={DESCRIPTION_PLACEHOLDER}
            palette={lightPalette}
          />
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerRule} aria-hidden />
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
          {canSave ? (
            <button
              type="button"
              className={styles.createBtn}
              onClick={handleCreate}
            >
              Create Palette
            </button>
          ) : null}
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!canSave}
            onClick={handleSave}
          >
            <AdIcon icon={faCheck} size={12} />
            Save Palette
          </button>
        </div>
      </footer>
    </div>
  );
};

export default CreatePalettePanel;
