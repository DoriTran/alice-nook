import type { FC } from 'react';

import logo from '@/assets/v0/logo/logo.png';
import logoImg from '@/assets/v0/logo/logo_img.png';
import logoText from '@/assets/v0/logo/logo_text.png';

import styles from './Logo.module.css';

interface LogoProps {
  text?: boolean;
  image?: boolean;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
}

const Logo: FC<LogoProps> = ({
  text,
  image,
  size,
  width,
  height,
  className,
}) => {
  const src = text ? logoText : image ? logoImg : logo;
  const resolvedWidth = size ?? width;
  const resolvedHeight = size ?? height;

  return (
    <img
      alt={text || !image ? 'Dear Diary' : ''}
      className={[styles.base, className].filter(Boolean).join(' ')}
      src={src}
      height={resolvedHeight}
      width={resolvedWidth}
    />
  );
};

export default Logo;
