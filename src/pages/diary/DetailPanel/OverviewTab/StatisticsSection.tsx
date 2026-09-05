import type { FC } from 'react';

import statisticDivider from '@/assets/v2/diary/detail-panel/statistic below devider.png';
import totalLeftDecoration from '@/assets/v2/diary/detail-panel/total left.png';
import totalRightDecoration from '@/assets/v2/diary/detail-panel/total right.png';
import { AdIcon } from '@/packages/base';

import type { MediaFilter } from '../../types';
import type { DetailPanelStats } from '../detailPanel.utils';

import DetailDecoration from '../components/DetailDecoration';
import styles from './OverviewTab.module.css';

export type StatisticsSectionProps = {
  stats: DetailPanelStats;
  onOpenMedia: (filter: MediaFilter) => void;
};

const CATEGORIES = [
  {
    id: 'images' as const,
    label: 'Images',
    icon: 'Image',
    tone: 'green',
    getValue: (stats: DetailPanelStats) => stats.imageCount,
  },
  {
    id: 'videos' as const,
    label: 'Videos',
    icon: 'Video',
    tone: 'yellow',
    getValue: (stats: DetailPanelStats) => stats.videoCount,
  },
  {
    id: 'files' as const,
    label: 'Files',
    icon: 'File',
    tone: 'purple',
    getValue: (stats: DetailPanelStats) => stats.fileCount,
  },
  {
    id: 'links' as const,
    label: 'Links',
    icon: 'Link',
    tone: 'blue',
    getValue: (stats: DetailPanelStats) => stats.linkCount,
  },
];

const StatisticsSection: FC<StatisticsSectionProps> = ({
  stats,
  onOpenMedia,
}) => {
  return (
    <>
      <button
        type="button"
        className={styles.totalCard}
        onClick={() => onOpenMedia('all')}
        aria-label="Open all media"
      >
        <DetailDecoration
          src={totalLeftDecoration}
          className={styles.totalLeftDecoration}
        />
        <DetailDecoration
          src={totalRightDecoration}
          className={styles.totalRightDecoration}
        />
        <span className={styles.totalContent}>
          <span className={styles.totalLabel}>Total</span>
          <span className={styles.totalLine}>
            <strong>{stats.totalMessages}</strong> Messages
          </span>
          <span className={styles.totalLine}>
            <strong>{stats.totalAttachments}</strong> Attachments
          </span>
        </span>
      </button>

      <div className={styles.categoryGrid}>
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={styles.categoryCard}
            data-tone={category.tone}
            onClick={() => onOpenMedia(category.id)}
            aria-label={`Open ${category.label.toLowerCase()} media`}
          >
            <span className={styles.categoryIcon} aria-hidden>
              <AdIcon
                icon={category.icon}
                source="lucide"
                size={18}
                strokeWidth={1.75}
              />
            </span>
            <span className={styles.categoryValue}>
              {category.getValue(stats)}
            </span>
            <span className={styles.categoryLabel}>{category.label}</span>
          </button>
        ))}
      </div>

      <div className={styles.updatedAt}>
        <DetailDecoration
          src={statisticDivider}
          className={styles.updatedDivider}
        />
        <span className={styles.updatedLabel}>Updated at</span>
        <span className={styles.updatedValue}>{stats.updatedLabel}</span>
      </div>
    </>
  );
};

export default StatisticsSection;
