import type { CSSProperties, FC, ReactNode } from 'react';

import {
  motion,
  useReducedMotion,
  type TargetAndTransition,
  type Transition,
} from 'framer-motion';

export type AdAnimationProps = {
  children: ReactNode;

  /** Vertical floating distance in px. Example: 8 → roughly -8px → +8px. */
  float?: number;

  /** Maximum rotation in degrees. Example: 2 → roughly -2deg → +2deg. */
  rotate?: number;

  /** Scale variation. Example: 1.03 → animate between 1 and 1.03. */
  size?: number;

  /** Full animation cycle duration in seconds. */
  duration?: number;

  /** Delay before animation starts, in seconds. */
  delay?: number;

  /** Override or extend the generated Motion animation / transition. */
  custom?: {
    animate?: TargetAndTransition;
    transition?: Transition;
  };

  className?: string;
  style?: CSSProperties;
};

const WRAPPER_STYLE: CSSProperties = {
  display: 'inline-block',
};

const AdAnimation: FC<AdAnimationProps> = ({
  children,
  float = 6,
  rotate = 1.5,
  size = 1,
  duration = 4,
  delay,
  custom,
  className,
  style,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const mergedStyle: CSSProperties = { ...WRAPPER_STYLE, ...style };

  if (shouldReduceMotion) {
    return (
      <div className={className} style={mergedStyle}>
        {children}
      </div>
    );
  }

  const animate: TargetAndTransition = {
    ...(float !== 0 ? { y: [-float, float, -float] } : {}),
    ...(rotate !== 0 ? { rotate: [-rotate, rotate, -rotate] } : {}),
    ...(size !== 1 ? { scale: [1, size, 1] } : {}),
    ...custom?.animate,
  };

  const transition: Transition = {
    duration,
    ease: 'easeInOut',
    repeat: Infinity,
    ...(delay != null ? { delay } : {}),
    ...custom?.transition,
  };

  return (
    <motion.div
      className={className}
      style={mergedStyle}
      animate={animate}
      transition={transition}
    >
      {children}
    </motion.div>
  );
};

export default AdAnimation;
