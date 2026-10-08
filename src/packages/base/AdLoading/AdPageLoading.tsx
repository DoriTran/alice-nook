import type { FC } from 'react';

import clsx from 'clsx';

import styles from './AdLoading.module.css';
import LoadingFlower from './LoadingFlower';
import NotebookLoader from './NotebookLoader';

export type AdPageLoadingProps = {
  className?: string;
  message?: string;
};

const AdPageLoading: FC<AdPageLoadingProps> = ({
  className,
  message = 'Opening your nook',
}) => (
  <main
    aria-busy="true"
    aria-live="polite"
    className={clsx(styles.pageLoading, className)}
    role="status"
  >
    <span className={styles.pageNotebook}>
      <NotebookLoader variant="page" />
    </span>
    <span className={styles.pageMessage}>
      <span>{message}</span>
      <span aria-hidden="true" className={styles.activityFlowers}>
        {[1, 2, 3].map((index) => (
          <LoadingFlower key={index} index={index} />
        ))}
      </span>
    </span>
  </main>
);

export default AdPageLoading;
