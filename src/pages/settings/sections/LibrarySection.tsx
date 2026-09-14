import {
  faDroplet,
  faIcons,
  faSwatchbook,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { useState, type FC } from 'react';

import { AdConfirmDialog, AdIcon } from '@/packages/base';
import { useAppStore, useDiaryStore } from '@/store';

import { ActionButton, SettingCard, SettingRow } from '../components';
import styles from './sections.module.css';

type PendingConfirm = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
};

const LibrarySection: FC = () => {
  const {
    iconPickerPrefs,
    colorPickerPrefs,
    clearRecentIcons,
    clearRecentColors,
    setFavoriteIcons,
  } = useAppStore([
    'iconPickerPrefs',
    'colorPickerPrefs',
    'clearRecentIcons',
    'clearRecentColors',
    'setFavoriteIcons',
  ]);

  const { customPalettes, deleteCustomPalette } = useDiaryStore([
    'customPalettes',
    'deleteCustomPalette',
  ]);

  const [pending, setPending] = useState<PendingConfirm | null>(null);

  const recentIconCount = iconPickerPrefs.recent.length;
  const favoriteIconCount = iconPickerPrefs.favorites.length;
  const recentColorCount = colorPickerPrefs.recent.length;
  const paletteList = Object.values(customPalettes);

  return (
    <>
      <SettingCard
        id="icons"
        icon={faIcons}
        title="Icons"
        description="Manage the icons you reach for most."
      >
        <SettingRow
          title="Frequently used icons"
          description={`${recentIconCount} frequently used icon${
            recentIconCount === 1 ? '' : 's'
          }.`}
          control={
            <ActionButton
              disabled={recentIconCount === 0}
              onClick={() =>
                setPending({
                  title: 'Clear frequently used icons',
                  message: 'This will remove your frequently used icons list.',
                  confirmLabel: 'Clear',
                  onConfirm: clearRecentIcons,
                })
              }
            >
              Clear frequent
            </ActionButton>
          }
        />
        <SettingRow
          title="Favorite icons"
          description={`${favoriteIconCount} favorite icon${
            favoriteIconCount === 1 ? '' : 's'
          }.`}
          control={
            <ActionButton
              disabled={favoriteIconCount === 0}
              onClick={() =>
                setPending({
                  title: 'Clear favorite icons',
                  message: 'This will remove all of your favorite icons.',
                  confirmLabel: 'Clear',
                  onConfirm: () => setFavoriteIcons([]),
                })
              }
            >
              Clear favorites
            </ActionButton>
          }
        />
      </SettingCard>

      <SettingCard
        id="colors"
        icon={faDroplet}
        title="Colors"
        description="Recently used colors across pickers."
      >
        <SettingRow
          title="Recent colors"
          description={`${recentColorCount} recently used color${
            recentColorCount === 1 ? '' : 's'
          }.`}
          control={
            <ActionButton
              disabled={recentColorCount === 0}
              onClick={() =>
                setPending({
                  title: 'Clear recent colors',
                  message: 'This will remove your recently used colors list.',
                  confirmLabel: 'Clear',
                  onConfirm: clearRecentColors,
                })
              }
            >
              Clear recent
            </ActionButton>
          }
        />
      </SettingCard>

      <SettingCard
        id="palettes"
        icon={faSwatchbook}
        title="Custom Palettes"
        description="Your saved color palettes."
      >
        {paletteList.length === 0 ? (
          <SettingRow
            title="No custom palettes yet"
            description="Create palettes from the color picker to see them here."
          />
        ) : (
          <div className={styles.paletteList}>
            {paletteList.map((palette) => (
              <div className={styles.paletteRow} key={palette.id}>
                <span
                  className={styles.paletteSwatch}
                  style={{ background: palette.baseColor }}
                />
                <span className={styles.paletteName}>{palette.name}</span>
                <ActionButton
                  aria-label={`Delete ${palette.name}`}
                  onClick={() =>
                    setPending({
                      title: 'Delete palette',
                      message: `Delete "${palette.name}"? This cannot be undone.`,
                      confirmLabel: 'Delete',
                      onConfirm: () =>
                        void deleteCustomPalette(palette.id).catch(
                          () => undefined,
                        ),
                    })
                  }
                  variant="danger"
                >
                  <AdIcon icon={faTrash} size={12} />
                </ActionButton>
              </div>
            ))}
          </div>
        )}
        <SettingRow
          title="Import / Export palettes"
          description="Share palettes or move them between devices."
          suggested
          control={<ActionButton disabled>Import / Export</ActionButton>}
        />
      </SettingCard>

      <AdConfirmDialog
        confirmLabel={pending?.confirmLabel}
        destructive
        message={pending?.message}
        onClose={() => setPending(null)}
        onConfirm={() => {
          pending?.onConfirm();
          setPending(null);
        }}
        opened={pending != null}
        title={pending?.title ?? ''}
      />
    </>
  );
};

export default LibrarySection;
