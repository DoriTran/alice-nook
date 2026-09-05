import { useCallback, useState, type FC } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getAuthCallbackError } from '@/auth/errors';
import { getAuthDestination } from '@/auth/redirects';
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
  const returnTo = getAuthDestination(`?${searchParams.toString()}`);
  const oauthError = getAuthCallbackError(searchParams);
  const [decorations] = useState(() =>
    buildAdriftDecorations(RANDOM_DECORATIONS, RANDOM_DECORATION_COUNT),
  );

  const handleModeChange = useCallback(
    (next: AuthMode) => {
      const nextParams = new URLSearchParams();
      const requestedReturnTo = searchParams.get('returnTo');
      if (requestedReturnTo) nextParams.set('returnTo', requestedReturnTo);
      if (next === 'signup') nextParams.set('mode', next);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
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
        <AuthCard
          initialError={oauthError}
          mode={mode}
          onModeChange={handleModeChange}
          returnTo={returnTo}
        />
      </div>
      <AuthResponsiveStyles />
    </main>
  );
};

export default AuthPage;
