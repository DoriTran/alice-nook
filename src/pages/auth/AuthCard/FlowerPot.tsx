import { useState, type FC } from 'react';

import { FLOWER_POTS } from '../auth.assets';
import { pickRandom } from '../auth.utils';
import styles from './AuthCard.module.css';

const FlowerPot: FC = () => {
  const [src] = useState(() => pickRandom(FLOWER_POTS));

  return (
    <div className={styles.flowerPotWrap}>
      <img alt="" className={styles.flowerPot} src={src} />
    </div>
  );
};

export default FlowerPot;
