import type { FC } from 'react';

import styles from './EmptyState.module.css';

const EmptyState: FC = () => {
  return (
    <div className={styles.root}>
      <div className={styles.icon} aria-hidden>
        🧭
      </div>
      <h2 className={styles.title}>Select a workspace</h2>
      <p className={styles.description}>
        Choose a workspace from My Workspaces, or open a Workspace App to get
        started.
      </p>
    </div>
  );
};

export default EmptyState;
