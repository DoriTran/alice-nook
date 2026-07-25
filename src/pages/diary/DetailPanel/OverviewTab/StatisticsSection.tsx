import type { FC } from 'react';

import { AdIcon } from '@/packages/base';

import type { DetailPanelStats } from '../detailPanel.utils';

import InfoCallout from '../components/InfoCallout';
import styles from './OverviewTab.module.css';

export type StatisticsSectionProps = {
  stats: DetailPanelStats;
};

const CATEGORIES = [
  {
    id: 'images',
    label: 'Images',
    icon: 'Image',
    tone: 'green',
    getValue: (stats: DetailPanelStats) => stats.imageCount,
  },
  {
    id: 'videos',
    label: 'Videos',
    icon: 'Video',
    tone: 'yellow',
    getValue: (stats: DetailPanelStats) => stats.videoCount,
  },
  {
    id: 'files',
    label: 'Files',
    icon: 'File',
    tone: 'purple',
    getValue: (stats: DetailPanelStats) => stats.fileCount,
  },
  {
    id: 'links',
    label: 'Links',
    icon: 'Link',
    tone: 'blue',
    getValue: (stats: DetailPanelStats) => stats.linkCount,
  },
] as const;

const StatisticsSection: FC<StatisticsSectionProps> = ({ stats }) => {
  return (
    <>
      <article className={styles.totalCard}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalLine}>
          <strong>{stats.totalMessages}</strong> Messages
        </span>
        <span className={styles.totalLine}>
          <strong>{stats.totalAttachments}</strong> Attachments
        </span>
      </article>

      <div className={styles.categoryGrid}>
        {CATEGORIES.map((category) => (
          <article
            key={category.id}
            className={styles.categoryCard}
            data-tone={category.tone}
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
          </article>
        ))}
      </div>

      <div className={styles.updatedAt}>
        <span className={styles.updatedLabel}>Updated at</span>
        <span className={styles.updatedValue}>{stats.updatedLabel}</span>
      </div>

      <InfoCallout>
        Counts are based on all messages in this chatbox.
      </InfoCallout>
    </>
  );
};

export default StatisticsSection;
