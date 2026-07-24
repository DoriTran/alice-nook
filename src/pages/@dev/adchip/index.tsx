import { type FC, useState } from 'react';

import { AdChip, type AdChipSize } from '@/packages/base';
import {
  COLOR_PRESETS,
  ColorMainSwatch,
  DEFAULT_COLOR_ID,
  PRESET_COLOR_IDS,
  type PresetColorId,
} from '@/packages/color';

import styles from './index.module.css';

const SIZE_PRESETS = ['small', 'medium', 'large'] as const;

type SizeMode = (typeof SIZE_PRESETS)[number] | 'custom';

const AdChipDev: FC = () => {
  const [label, setLabel] = useState('diary');
  const [colorId, setColorId] = useState<PresetColorId>(DEFAULT_COLOR_ID);
  const [sizeMode, setSizeMode] = useState<SizeMode>('small');
  const [customSize, setCustomSize] = useState(28);
  const [useCount, setUseCount] = useState(false);
  const [count, setCount] = useState(3);
  const [removable, setRemovable] = useState(true);
  const [measure, setMeasure] = useState(false);
  const [extraClass, setExtraClass] = useState(false);
  const [reorderable, setReorderable] = useState(false);
  const [lastEvent, setLastEvent] = useState<string>('—');

  const size: AdChipSize =
    sizeMode === 'custom' ? customSize : sizeMode;

  const chipProps = {
    label,
    colorId,
    size,
    count: useCount ? count : undefined,
    onRemove: removable
      ? () => setLastEvent(`onRemove @ ${new Date().toLocaleTimeString()}`)
      : undefined,
    className: extraClass ? 'adchip-dev-outline' : undefined,
    'data-tag-measure': measure || undefined,
    reorderProps: reorderable
      ? {
          title: 'reorderProps demo',
          onPointerDown: () =>
            setLastEvent(
              `reorderProps.onPointerDown @ ${new Date().toLocaleTimeString()}`,
            ),
        }
      : undefined,
  };

  return (
    <div className={styles.root}>
      <style>{`
        .adchip-dev-outline {
          outline: 2px dashed rgba(92, 61, 74, 0.45);
          outline-offset: 3px;
        }
      `}</style>

      <div className={styles.controls}>
        <div className={styles.controlsRow}>
          <label className={styles.field}>
            Label
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            Size
            <select
              value={sizeMode}
              onChange={(e) => setSizeMode(e.target.value as SizeMode)}
            >
              {SIZE_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
              <option value="custom">custom (px)</option>
            </select>
          </label>

          {sizeMode === 'custom' ? (
            <label className={styles.field}>
              Custom size
              <input
                type="range"
                min={12}
                max={64}
                value={customSize}
                onChange={(e) => setCustomSize(Number(e.target.value))}
              />
              <span className={styles.rangeValue}>{customSize}px</span>
            </label>
          ) : null}

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={useCount}
              onChange={(e) => setUseCount(e.target.checked)}
            />
            Count
          </label>

          {useCount ? (
            <label className={styles.field}>
              Count value
              <input
                type="number"
                min={0}
                max={999}
                value={count}
                onChange={(e) => setCount(Number(e.target.value) || 0)}
              />
            </label>
          ) : null}

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={removable}
              onChange={(e) => setRemovable(e.target.checked)}
            />
            Removable
          </label>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={measure}
              onChange={(e) => setMeasure(e.target.checked)}
            />
            data-tag-measure
          </label>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={extraClass}
              onChange={(e) => setExtraClass(e.target.checked)}
            />
            className outline
          </label>

          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={reorderable}
              onChange={(e) => setReorderable(e.target.checked)}
            />
            reorderProps
          </label>
        </div>

        <div className={styles.field}>
          colorId
          <div className={styles.swatches}>
            {PRESET_COLOR_IDS.map((id) => (
              <ColorMainSwatch
                key={id}
                colorId={id}
                className={styles.swatch}
                data-active={colorId === id || undefined}
                title={`${COLOR_PRESETS[id].name} (${id})`}
                aria-label={COLOR_PRESETS[id].name}
                role="button"
                tabIndex={0}
                onClick={() => setColorId(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setColorId(id);
                  }
                }}
              />
            ))}
          </div>
          <select
            value={colorId}
            onChange={(e) => setColorId(e.target.value as PresetColorId)}
          >
            {PRESET_COLOR_IDS.map((id) => (
              <option key={id} value={id}>
                {COLOR_PRESETS[id].name} ({id})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.preview}>
        <div className={styles.previewBlock}>
          <span className={styles.previewLabel}>Live preview</span>
          <div className={styles.previewStage}>
            <AdChip {...chipProps} />
          </div>
          <p className={styles.log}>Last event: {lastEvent}</p>
        </div>

        <div className={styles.previewBlock}>
          <span className={styles.previewLabel}>Props</span>
          <pre className={styles.propsDump}>
            {JSON.stringify(
              {
                label,
                colorId,
                size,
                count: useCount ? count : undefined,
                onRemove: removable ? '() => …' : undefined,
                className: extraClass ? 'adchip-dev-outline' : undefined,
                'data-tag-measure': measure || undefined,
                reorderProps: reorderable
                  ? '{ title, onPointerDown }'
                  : undefined,
              },
              null,
              2,
            )}
          </pre>
        </div>

        <div className={styles.previewBlock}>
          <span className={styles.previewLabel}>Size gallery</span>
          <div className={styles.gallery}>
            {SIZE_PRESETS.map((preset) => (
              <AdChip
                key={preset}
                label={preset}
                colorId={colorId}
                size={preset}
              />
            ))}
            <AdChip label="24px" colorId={colorId} size={24} />
            <AdChip label="36px" colorId={colorId} size={36} />
          </div>
        </div>

        <div className={styles.previewBlock}>
          <span className={styles.previewLabel}>All presets</span>
          <div className={styles.gallery}>
            {PRESET_COLOR_IDS.map((id) => (
              <AdChip key={id} label={id} colorId={id} size="small" />
            ))}
          </div>
        </div>

        <div className={styles.previewBlock}>
          <span className={styles.previewLabel}>With count</span>
          <div className={styles.gallery}>
            <AdChip label="notes" colorId={colorId} count={1} />
            <AdChip label="notes" colorId={colorId} count={12} />
            <AdChip label="notes" colorId={colorId} count={0} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdChipDev;
