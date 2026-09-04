import type { FC } from 'react';

import expandedLogo from '@/assets/v2/logo/expanded.png';
import stackedLogo from '@/assets/v2/logo/stacked.png';

import styles from './Logo.module.css';

interface LogoProps {
  variant: 'expanded' | 'stacked';
  className?: string;
}

const Logo: FC<LogoProps> = ({ variant, className }) => {
  return (
    <span
      aria-label="Alice Nook"
      className={[styles.base, className].filter(Boolean).join(' ')}
      data-variant={variant}
      role="img"
    >
      <img
        aria-hidden="true"
        alt=""
        className={`${styles.image} ${styles.expanded}`}
        src={expandedLogo}
      />
      <img
        aria-hidden="true"
        alt=""
        className={`${styles.image} ${styles.stacked}`}
        src={stackedLogo}
      />
    </span>
  );
};

export default Logo;
