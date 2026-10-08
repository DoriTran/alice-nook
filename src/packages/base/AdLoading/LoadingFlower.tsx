import type { FC } from 'react';

import styles from './AdLoading.module.css';

type LoadingFlowerProps = {
  index: number;
};

const LoadingFlower: FC<LoadingFlowerProps> = ({ index }) => (
  <svg
    aria-hidden="true"
    className={styles.activityFlower}
    data-loading-flower={index}
    focusable="false"
    viewBox="0 0 16 16"
  >
    <g className={styles.activityFlowerPetals}>
      <ellipse cx="8" cy="4.2" rx="2.15" ry="3.15" />
      <ellipse cx="8" cy="4.2" rx="2.15" ry="3.15" transform="rotate(72 8 8)" />
      <ellipse
        cx="8"
        cy="4.2"
        rx="2.15"
        ry="3.15"
        transform="rotate(144 8 8)"
      />
      <ellipse
        cx="8"
        cy="4.2"
        rx="2.15"
        ry="3.15"
        transform="rotate(216 8 8)"
      />
      <ellipse
        cx="8"
        cy="4.2"
        rx="2.15"
        ry="3.15"
        transform="rotate(288 8 8)"
      />
    </g>
    <circle className={styles.activityFlowerCenter} cx="8" cy="8" r="1.75" />
  </svg>
);

export default LoadingFlower;
