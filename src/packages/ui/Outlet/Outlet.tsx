import type { FC } from 'react';

import { Outlet as RouterOutlet, useLocation } from 'react-router-dom';

import LeftPanel from './LeftPanel/LeftPanel';
import MobileNavigation from './MobileNavigation/MobileNavigation';
import styles from './Outlet.module.css';

const Outlet: FC = () => {
  const location = useLocation();
  const hideMobileNavigation = /^\/diary\/[^/]+(?:\/details)?\/?$/.test(
    location.pathname,
  );

  return (
    <div className={styles.root}>
      <LeftPanel />
      <div
        className={styles.content}
        data-mobile-nav-hidden={hideMobileNavigation || undefined}
      >
        <RouterOutlet />
      </div>
      <MobileNavigation hidden={hideMobileNavigation} />
    </div>
  );
};

export default Outlet;
