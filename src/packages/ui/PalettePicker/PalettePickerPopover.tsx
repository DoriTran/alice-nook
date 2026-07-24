import { useMediaQuery } from '@mantine/hooks';
import { useCallback, useState, type FC } from 'react';

import type { ColorId, PaletteShade } from '@/packages/color';

import CreatePalettePanel from './CreatePalettePanel';
import styles from './PalettePickerPopover.module.css';
import PaletteSelectionPanel from './PaletteSelectionPanel';

export type PalettePickerPopoverProps = {
  value: ColorId;
  onChange: (value: ColorId) => void;
  onValueChange: (value: ColorId) => void;
  onClose: () => void;
  shades?: PaletteShade[];
  /** Force narrow layout: create panel hidden until "Create new". */
  stacked?: boolean;
};

type PopoverView = 'browse' | 'create';

const PalettePickerPopover: FC<PalettePickerPopoverProps> = ({
  value,
  onChange,
  onValueChange,
  onClose,
  shades,
  stacked = false,
}) => {
  const [view, setView] = useState<PopoverView>('browse');
  const isWide = useMediaQuery('(min-width: 56rem)');
  const hideCreateNew = stacked || !isWide ? view === 'create' : true;

  const handleSelect = useCallback(
    (colorId: ColorId) => {
      onChange(colorId);
      onClose();
    },
    [onChange, onClose],
  );

  const handleSaved = useCallback(
    (colorId: ColorId) => {
      onChange(colorId);
      onClose();
    },
    [onChange, onClose],
  );

  const openCreate = useCallback(() => {
    setView('create');
  }, []);

  const openBrowse = useCallback(() => {
    setView('browse');
  }, []);

  // Stacked: mount one panel at a time so "Create new" doesn't hide all
  // popover content (CSS dual-panel toggle can close the AdPopover).
  if (stacked) {
    return (
      <div className={styles.root} data-stacked>
        {view === 'browse' ? (
          <div className={styles.selectionPanel}>
            <PaletteSelectionPanel
              value={value}
              onSelect={handleSelect}
              onValueChange={onValueChange}
              onClose={onClose}
              onCreateNew={openCreate}
              hideCreateNew={false}
              shades={shades}
            />
          </div>
        ) : (
          <div className={styles.createPanelStacked}>
            <CreatePalettePanel
              onCancel={openBrowse}
              onSaved={handleSaved}
              showBack
              shades={shades}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.layout} data-view={view}>
        <div className={styles.selectionPanel}>
          <PaletteSelectionPanel
            value={value}
            onSelect={handleSelect}
            onValueChange={onValueChange}
            onClose={onClose}
            onCreateNew={openCreate}
            hideCreateNew={hideCreateNew}
            shades={shades}
          />
        </div>
        <div className={styles.createPanel}>
          <CreatePalettePanel
            onCancel={openBrowse}
            onSaved={handleSaved}
            showBack={view === 'create'}
            shades={shades}
          />
        </div>
      </div>
    </div>
  );
};

export default PalettePickerPopover;
