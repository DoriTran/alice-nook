import { useEffect, useState, type FC } from 'react';

import { pickRandomRabbitLoader } from '../chatboxList.assets';
import Create from '../Create/Create';
import styles from './Header.module.css';

export type HeaderProps = {
  onOpenCreate: (entity: 'chatbox' | 'group') => void;
};

const Header: FC<HeaderProps> = ({ onOpenCreate }) => {
  const [rabbitLoader] = useState(() => pickRandomRabbitLoader());
  const [rabbitUrl, setRabbitUrl] = useState<string>();

  useEffect(() => {
    let active = true;

    rabbitLoader?.().then((module) => {
      if (active) {
        setRabbitUrl(module.default);
      }
    });

    return () => {
      active = false;
    };
  }, [rabbitLoader]);

  return (
    <header className={styles.root}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>My Diary</h1>
        {rabbitUrl ? (
          <img className={styles.rabbit} src={rabbitUrl} alt="" aria-hidden />
        ) : null}
      </div>
      <Create onOpenCreate={onOpenCreate} />
    </header>
  );
};

export default Header;
