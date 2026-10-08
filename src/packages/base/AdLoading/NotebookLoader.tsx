import type { FC } from 'react';

import styles from './AdLoading.module.css';

type NotebookLoaderProps = {
  variant: 'inline' | 'page';
};

const NotebookLoader: FC<NotebookLoaderProps> = ({ variant }) => (
  <svg
    aria-hidden="true"
    className={styles.notebook}
    data-variant={variant}
    focusable="false"
    viewBox="0 0 96 72"
  >
    <g className={styles.bunnyEars}>
      <path d="M38.7 20.5C34.2 14 34.4 5.6 39.2 2.2c5 3.4 6.9 11.2 5.2 19.8z" />
      <path d="M51.5 22c-1.6-8.2.3-15.6 5.3-19.1 4.7 4.2 4.4 12.6-.3 18.6z" />
      <path
        className={styles.bunnyEarInner}
        d="M39.5 17.3c-2.2-4.7-1.8-9.3-.1-11.5 2.2 2.7 3.2 7.1 2.4 12.2z"
      />
      <path
        className={styles.bunnyEarInner}
        d="M54.2 18.4c-.8-4.8.2-9 2.4-11.7 1.8 2.7 2 7.4-.2 11.7z"
      />
    </g>
    <g className={styles.cover}>
      <path d="M7 17.5C20.5 13 34.2 14.3 48 21v42C34.6 56.4 21 55.1 7 59.5z" />
      <path d="M89 17.5C75.5 13 61.8 14.3 48 21v42c13.4-6.6 27-7.9 41-3.5z" />
    </g>
    <g className={styles.leftPage}>
      <path d="M10.5 13.5C23 10.3 35.7 12.2 48 19v39.5c-12-6-24.5-7.7-37.5-4.4z" />
      <path className={styles.pageLine} d="M18 25c8.2-1.1 15.6.2 22 3.4" />
      <path className={styles.pageLine} d="M18 33c7.9-.8 15.2.5 22 3.7" />
      <path className={styles.pageLine} d="M18 41c7.5-.5 14.7.8 22 3.8" />
    </g>
    <g className={styles.rightPage}>
      <path d="M85.5 13.5C73 10.3 60.3 12.2 48 19v39.5c12-6 24.5-7.7 37.5-4.4z" />
      <path className={styles.pageLine} d="M56 28.4c6.4-3.2 13.8-4.5 22-3.4" />
      <path className={styles.pageLine} d="M56 36.7c6.8-3.2 14.1-4.5 22-3.7" />
      <path className={styles.pageLine} d="M56 44.8c7.3-3 14.5-4.3 22-3.8" />
    </g>
    <g className={styles.flipPage}>
      <path d="M48 19c12.3-6.8 25-8.7 37.5-5.5v40.6C72.5 50.8 60 52.5 48 58.5z" />
      <path className={styles.pageLine} d="M56 28.4c6.4-3.2 13.8-4.5 22-3.4" />
      <path className={styles.pageLine} d="M56 36.7c6.8-3.2 14.1-4.5 22-3.7" />
      <path className={styles.pageLine} d="M56 44.8c7.3-3 14.5-4.3 22-3.8" />
    </g>
    <g className={styles.bookmark}>
      <path d="M67 15.2h7v19.4l-3.5-3.3-3.5 3.3z" />
    </g>
    <g className={styles.heart}>
      <path d="M28.5 24.7c-2.8-3.1-8.2.6-1.8 6.3l1.8 1.6 1.8-1.6c6.4-5.7 1-9.4-1.8-6.3z" />
    </g>
    <g className={styles.mascotFlower}>
      <g className={styles.mascotFlowerPetals}>
        <ellipse cx="28.5" cy="24.8" rx="2.5" ry="3.7" />
        <ellipse
          cx="28.5"
          cy="24.8"
          rx="2.5"
          ry="3.7"
          transform="rotate(72 28.5 29.2)"
        />
        <ellipse
          cx="28.5"
          cy="24.8"
          rx="2.5"
          ry="3.7"
          transform="rotate(144 28.5 29.2)"
        />
        <ellipse
          cx="28.5"
          cy="24.8"
          rx="2.5"
          ry="3.7"
          transform="rotate(216 28.5 29.2)"
        />
        <ellipse
          cx="28.5"
          cy="24.8"
          rx="2.5"
          ry="3.7"
          transform="rotate(288 28.5 29.2)"
        />
      </g>
      <circle className={styles.mascotFlowerCenter} cx="28.5" cy="29.2" r="2" />
    </g>
    <g className={styles.sparkle}>
      <path d="M84 5.5c.4 3.6 2.1 5.3 5.5 5.7-3.4.4-5.1 2.1-5.5 5.7-.4-3.6-2.1-5.3-5.5-5.7 3.4-.4 5.1-2.1 5.5-5.7z" />
    </g>
    <path className={styles.spine} d="M48 19v39.5" />
  </svg>
);

export default NotebookLoader;
