import type { FC } from 'react';

import styles from './ProgressBarRow.module.css';

export type ProgressBarRowProps = {
  label: string;
  count: number;
  total: number;
  tone?: 'primary' | 'blue';
  onClick?: () => void;
};

const ProgressBarRow: FC<ProgressBarRowProps> = ({
  label,
  count,
  total,
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
          <span className={styles.label}>{label}</span>
          <span className={styles.count}>
            {count} / {total}
          </span>
        </div>
      </div>
    </button>
  );
};

export default ProgressBarRow;
