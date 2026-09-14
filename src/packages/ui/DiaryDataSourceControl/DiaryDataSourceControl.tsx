import type { FC } from 'react';

import { faCloud, faHardDrive } from '@fortawesome/free-solid-svg-icons';
import clsx from 'clsx';

import { AdIcon } from '@/packages/base';
import { useSettingsStore } from '@/store';
import {
  hydrateCloudDiary,
  switchDiaryDataSource,
  useDiarySourceRuntime,
} from '@/store/diary/source';

import styles from './DiaryDataSourceControl.module.css';

type Props = { compact?: boolean };

const DiaryDataSourceControl: FC<Props> = ({ compact = false }) => {
  const source = useSettingsStore('diaryDataSource');
  const { cloudStatus, error } = useDiarySourceRuntime();

  return (
    <div className={clsx(styles.root, compact && styles.compact)}>
      <div className={styles.options} aria-label="Diary data source">
        <button
          type="button"
          className={styles.option}
          data-active={source === 'local' || undefined}
          onClick={() => void switchDiaryDataSource('local')}
        >
          <AdIcon icon={faHardDrive} size={compact ? 11 : 13} />
          Local
        </button>
        <button
          type="button"
          className={styles.option}
          data-active={source === 'cloud' || undefined}
          onClick={() => void switchDiaryDataSource('cloud')}
        >
          <AdIcon icon={faCloud} size={compact ? 11 : 13} />
          Cloud
        </button>
      </div>
      {!compact ? (
        <div className={styles.status} aria-live="polite">
          <span>
            {source === 'local'
              ? 'Stored only on this device.'
              : cloudStatus === 'ready'
                ? 'Synced with your Alice Nook account.'
                : cloudStatus === 'loading'
                  ? 'Opening your Cloud Diary…'
                  : cloudStatus === 'auth-required'
                    ? 'Sign in to open your Cloud Diary.'
                    : error || 'Cloud Diary is ready to connect.'}
          </span>
          {source === 'cloud' && cloudStatus === 'error' ? (
            <button
              type="button"
              className={styles.retry}
              onClick={() => void hydrateCloudDiary()}
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default DiaryDataSourceControl;
