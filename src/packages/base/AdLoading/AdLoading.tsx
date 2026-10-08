import type { FC } from 'react';

import clsx from 'clsx';

import styles from './AdLoading.module.css';
import NotebookLoader from './NotebookLoader';

export type LoadingSize = 'xs' | 'sm' | 'md' | 'lg';

export type AdLoadingProps = {
  className?: string;
  message?: string;
  size?: LoadingSize;
};

const AdLoading: FC<AdLoadingProps> = ({ className, message, size = 'sm' }) => (
  <span
    aria-busy="true"
    aria-label={message ? undefined : 'Loading…'}
    aria-live="polite"
    className={clsx(styles.loading, className)}
    data-size={size}
    role="status"
  >
    <NotebookLoader variant="inline" />
    {message && <span className={styles.inlineMessage}>{message}</span>}
  </span>
);

export default AdLoading;
