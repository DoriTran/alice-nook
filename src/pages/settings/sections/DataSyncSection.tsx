import {
  faCloudArrowUp,
  faHardDrive,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { clear as idbClear } from 'idb-keyval';
import { useEffect, useState, type FC } from 'react';

import { AdConfirmDialog } from '@/packages/base';
import DiaryDataSourceControl from '@/packages/ui/DiaryDataSourceControl';
import { useDiaryStore } from '@/store';

import { ActionButton, SettingCard, SettingRow } from '../components';
import styles from './sections.module.css';

const formatBytes = (bytes: number): string => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

type ConfirmKind = 'localStorage' | 'allData' | null;

const DataSyncSection: FC = () => {
  const { messages, chatboxes, customPalettes } = useDiaryStore([
    'messages',
    'chatboxes',
    'customPalettes',
  ]);

  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  useEffect(() => {
    let active = true;
    if (navigator.storage?.estimate) {
      void navigator.storage.estimate().then((result) => {
        if (active) setEstimate(result);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  const usage = estimate?.usage ?? 0;
  const quota = estimate?.quota ?? 0;
  const usagePercent = quota > 0 ? Math.min((usage / quota) * 100, 100) : 0;

  const messageCount = Object.keys(messages).length;
  const chatboxCount = Object.keys(chatboxes).length;
  const paletteCount = Object.keys(customPalettes).length;

  const handleResetLocalStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleClearAllData = async () => {
    localStorage.clear();
    await idbClear();
    window.location.reload();
  };

  return (
    <>
      <SettingCard
        id="diary-source"
        icon={faCloudArrowUp}
        title="Diary data source"
        description="Choose which independent Diary dataset you want to use. Switching never copies or merges data."
      >
        <SettingRow
          title="Active source"
          description="Local stays on this device. Cloud belongs to your signed-in account."
          stacked
        >
          <DiaryDataSourceControl />
        </SettingRow>
      </SettingCard>

      <SettingCard
        id="storage"
        icon={faHardDrive}
        title="Storage"
        description="How much space Dear Diary is using on this device."
      >
        <SettingRow
          title="Storage usage"
          description={
            quota > 0
              ? `${formatBytes(usage)} of ${formatBytes(quota)} used`
              : 'Estimating storage usage…'
          }
          stacked
        >
          <div className={styles.usageBar}>
            <span
              className={styles.usageFill}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </SettingRow>
        <SettingRow title="Diary contents" description="Stored in IndexedDB." />
        <div className={styles.statGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{messageCount}</span>
            <span className={styles.statLabel}>Messages</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{chatboxCount}</span>
            <span className={styles.statLabel}>Chatboxes</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{paletteCount}</span>
            <span className={styles.statLabel}>Palettes</span>
          </div>
        </div>
      </SettingCard>

      <SettingCard
        id="backup"
        icon={faCloudArrowUp}
        title="Backup & Export"
        description="Move your diary between devices."
      >
        <SettingRow
          title="Export diary"
          description="Download a backup of your diary as a file."
          suggested
          control={<ActionButton disabled>Export</ActionButton>}
        />
        <SettingRow
          title="Import diary"
          description="Restore your diary from a backup file."
          suggested
          control={<ActionButton disabled>Import</ActionButton>}
        />
        <SettingRow
          title="Backup"
          description="Automatic cloud backups of your data."
          suggested
          control={<ActionButton disabled>Set up backup</ActionButton>}
        />
      </SettingCard>

      <SettingCard
        id="danger"
        icon={faTriangleExclamation}
        title="Danger Zone"
        description="These actions are permanent."
      >
        <SettingRow
          title="Reset local storage"
          description="Clear cached UI preferences (theme, layout, recents)."
          control={
            <ActionButton
              onClick={() => setConfirm('localStorage')}
              variant="danger"
            >
              Reset
            </ActionButton>
          }
        />
        <SettingRow
          title="Clear all data"
          description="Erase all local diary data, including messages and settings."
          control={
            <ActionButton
              onClick={() => setConfirm('allData')}
              variant="danger"
            >
              Clear everything
            </ActionButton>
          }
        />
      </SettingCard>

      <AdConfirmDialog
        confirmLabel="Reset"
        destructive
        message="This clears cached preferences and reloads the app. Your diary contents are kept."
        onClose={() => setConfirm(null)}
        onConfirm={handleResetLocalStorage}
        opened={confirm === 'localStorage'}
        title="Reset local storage?"
      />
      <AdConfirmDialog
        confirmLabel="Erase everything"
        destructive
        message="This permanently deletes all local data — messages, chatboxes, palettes and settings. This cannot be undone."
        onClose={() => setConfirm(null)}
        onConfirm={() => void handleClearAllData()}
        opened={confirm === 'allData'}
        title="Clear all data?"
      />
    </>
  );
};

export default DataSyncSection;
