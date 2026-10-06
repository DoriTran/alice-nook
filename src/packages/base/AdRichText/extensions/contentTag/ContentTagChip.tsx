import type { CSSProperties, FC } from 'react';

import styles from './ContentTagNodeView.module.css';

const ContentTagChip: FC<{ label: string; style?: CSSProperties }> = ({
  label,
  style,
}) => (
  <span className={styles.chip} style={style}>
    #{label}
  </span>
);

export default ContentTagChip;
