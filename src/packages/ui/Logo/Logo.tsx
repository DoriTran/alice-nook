import type { FC } from 'react';

import expandedLogo from '@/assets/v2/logo/expanded.png';
import stackedLogo from '@/assets/v2/logo/stacked.png';

import styles from './Logo.module.css';

interface LogoProps {
  variant: 'expanded' | 'stacked';
  className?: string;
}

const Logo: FC<LogoProps> = ({ variant, className }) => {
  const src = variant === 'expanded' ? expandedLogo : stackedLogo;

  return (
    <img
      alt="Alice Nook"
      className={[styles.base, className].filter(Boolean).join(' ')}
      src={src}
    />
  );
};

export default Logo;
