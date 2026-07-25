import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useState, type FC, type ReactNode } from 'react';

import { AdIcon } from '@/packages/base';

import styles from './OverviewTab.module.css';

export type CollapsibleSectionProps = {
  title: string;
  defaultExpanded?: boolean;
  children: ReactNode;
};

const CollapsibleSection: FC<CollapsibleSectionProps> = ({
  title,
  defaultExpanded = true,
  children,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.sectionHeader}
        aria-expanded={expanded}
        data-expanded={expanded || undefined}
        onClick={() => setExpanded((value) => !value)}
      >
        <h3 className={styles.heading}>{title}</h3>
        <span className={styles.sectionCaret} aria-hidden>
          <AdIcon icon={faChevronRight} size={11} />
        </span>
      </button>
      {expanded ? <div className={styles.sectionBody}>{children}</div> : null}
    </section>
  );
};

export default CollapsibleSection;
