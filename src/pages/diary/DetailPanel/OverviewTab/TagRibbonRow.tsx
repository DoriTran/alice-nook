import type { CSSProperties, FC } from 'react';

import { AdIcon } from '@/packages/base';
import { tagStyles, useResolvedPalette } from '@/packages/color';

import type { DetailPanelTag } from '../detailPanel.utils';

import styles from './OverviewTab.module.css';

export type TagRibbonRowProps = {
  tag: DetailPanelTag;
  onClick: (tagId: string) => void;
};

const TagRibbonRow: FC<TagRibbonRowProps> = ({ tag, onClick }) => {
  const palette = useResolvedPalette(tag.colorId);
  const itemStyle = {
    '--tag-ribbon-fold': palette.main,
  } as CSSProperties;
  const ribbonStyle = tagStyles(palette);

  return (
    <li className={styles.tagRibbonItem} style={itemStyle}>
      <button
        type="button"
        className={styles.tagRibbon}
        style={ribbonStyle}
        onClick={() => onClick(tag.tagId)}
        aria-label={`View messages tagged ${tag.label}`}
      >
        <span className={styles.tagRibbonIcon} aria-hidden>
          <AdIcon
            icon="Tag"
            source="lucide"
            size={14}
            strokeWidth={2}
            color={palette.strong}
          />
        </span>
        <span className={styles.tagRibbonLabel}>#{tag.label}</span>
        <span className={styles.tagRibbonCount}>{tag.count}</span>
      </button>
    </li>
  );
};

export default TagRibbonRow;
