import type { FC, ReactNode } from 'react';

import { ChevronRight } from 'lucide-react';

import styles from './ProgressBarRow.module.css';

export type ProgressBarRowProps = {
  label: string;
  count: number;
  total: number;
  icon?: ReactNode;
  tone?: 'primary' | 'blue';
  onClick?: () => void;
};

const ProgressBarRow: FC<ProgressBarRowProps> = ({
  label,
  count,
  total,
  icon,
  tone = 'primary',
  onClick,
}) => {
  const ratio = total > 0 ? Math.min(count / total, 1) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <button
      type="button"
      className={styles.root}
      data-tone={tone}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className={styles.track}>
        <span
          className={styles.fill}
          style={{ width: `${percent}%` }}
          aria-hidden
        />
        <div className={styles.content}>
          <span className={styles.labelGroup}>
            {icon ? (
              <span className={styles.icon} aria-hidden>
                {icon}
              </span>
            ) : null}
            <span className={styles.label}>{label}</span>
          </span>
          <span className={styles.trailing}>
            <span className={styles.count}>
              {count} / {total}
            </span>
            <ChevronRight
              className={styles.chevron}
              size={13}
              strokeWidth={1.8}
              aria-hidden
            />
          </span>
        </div>
      </div>
    </button>
  );
};

export default ProgressBarRow;
