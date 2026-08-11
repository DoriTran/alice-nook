import { motion, useReducedMotion } from 'framer-motion';
import { type CSSProperties } from 'react';

import { AdAnimation } from '@/packages/base';

import type { AdriftDecoration } from './AdriftBackground.types';

import styles from './AdriftBackground.module.css';

export type AdriftBackgroundProps = {
  decorations: readonly AdriftDecoration[];
  className?: string;
};

/** Horizontal travel span in vw (-12vw to 112vw). */
const TRAVEL_X_VW = 124;

/** Start slightly above so pieces enter from the top while moving right. */
const START_Y_VW = -6;

function travelDeltaY(angleDeg: number): number {
  const radians = (angleDeg * Math.PI) / 180;
  return TRAVEL_X_VW * Math.tan(radians);
}

function AdriftBackground({ decorations, className }: AdriftBackgroundProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className={[styles.layer, className].filter(Boolean).join(' ')}
    >
      {decorations.map((decoration, index) => {
        const deltaY = travelDeltaY(decoration.angle);
        const startX = '-12vw';
        const endX = '112vw';
        const startY = `${START_Y_VW}vw`;
        const endY = `${deltaY}vw`;

        const travelerStyle: CSSProperties = {
          top: `${decoration.top}%`,
        };

        const imgStyle: CSSProperties = {
          width: decoration.size,
          ...(decoration.opacity != null
            ? { opacity: decoration.opacity }
            : {}),
          ...(decoration.blur != null && decoration.blur > 0
            ? { filter: `blur(${decoration.blur}px)` }
            : {}),
        };

        const localMotion = (
          <AdAnimation
            drift={decoration.drift}
            duration={decoration.floatDuration}
            float={decoration.float}
            rotate={decoration.rotate}
            size={decoration.scale}
          >
            <img
              alt=""
              className={styles.asset}
              src={decoration.asset}
              style={imgStyle}
            />
          </AdAnimation>
        );

        if (shouldReduceMotion) {
          return (
            <div
              className={styles.traveler}
              key={`${decoration.asset}-${index}`}
              style={{
                ...travelerStyle,
                transform: `translate(50vw, ${(START_Y_VW + deltaY) / 2}vw)`,
              }}
            >
              {localMotion}
            </div>
          );
        }

        return (
          <motion.div
            animate={{ x: [startX, endX], y: [startY, endY] }}
            className={styles.traveler}
            initial={{ x: startX, y: startY }}
            key={`${decoration.asset}-${index}`}
            style={travelerStyle}
            transition={{
              duration: decoration.travelDuration,
              delay: decoration.travelDelay,
              ease: 'linear',
              repeat: Infinity,
            }}
          >
            {localMotion}
          </motion.div>
        );
      })}
    </div>
  );
}

export default AdriftBackground;
