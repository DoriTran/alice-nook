import { useState, type CSSProperties, type FC } from 'react';

import { FLOWER_POTS } from '../auth.assets';
import { pickRandom } from '../auth.utils';
import { resolveResponsive, useViewportSize } from '../resolveResponsive';
import styles from './AuthCard.module.css';
import { authCard } from './authCard.config';

const FlowerPot: FC = () => {
  const [src] = useState(() => pickRandom(FLOWER_POTS));
  const vp = useViewportSize();
  const flowerPot = resolveResponsive(authCard.flowerPot, vp);
  const style: CSSProperties = { width: flowerPot.width };

  return (
    <div className={styles.flowerPotWrap}>
      <img alt="" className={styles.flowerPot} src={src} style={style} />
    </div>
  );
};

export default FlowerPot;
