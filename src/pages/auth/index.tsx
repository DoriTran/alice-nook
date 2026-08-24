import { useCallback, useState, type FC } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AdriftBackground } from '@/packages/ui';

import {
  RANDOM_DECORATION_COUNT,
  RANDOM_DECORATIONS,
  authAssets,
} from './auth.assets';
import { buildAdriftDecorations } from './auth.utils';
import AuthCard, { type AuthMode } from './AuthCard/AuthCard';
import AuthLeftPanel from './AuthLeftPanel/AuthLeftPanel';
import styles from './AuthPage.module.css';
import { AuthResponsiveStyles } from './authResponsive.config';

function parseMode(value: string | null): AuthMode {
  return value === 'signup' ? 'signup' : 'signin';
}

const AuthPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = parseMode(searchParams.get('mode'));
  const [decorations] = useState(() =>
    buildAdriftDecorations(RANDOM_DECORATIONS, RANDOM_DECORATION_COUNT),
  );

  const handleModeChange = useCallback(
    (next: AuthMode) => {
      setSearchParams(next === 'signin' ? {} : { mode: next }, {
        replace: true,
      });
    },
    [setSearchParams],
  );

  return (
    <main
      className={styles.page}
      style={{ backgroundImage: `url(${authAssets.authBg})` }}
    >
      <div className={styles.adriftBand}>
        <AdriftBackground decorations={decorations} />
      </div>
      <div className={styles.content}>
        <AuthLeftPanel />
        <AuthCard mode={mode} onModeChange={handleModeChange} />
      </div>
      <AuthResponsiveStyles />
    </main>
  );
};

export default AuthPage;
