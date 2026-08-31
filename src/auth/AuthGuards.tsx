import type { FC, PropsWithChildren } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { useSession } from './auth-client';
import styles from './AuthGuards.module.css';
import {
  DEFAULT_AUTH_DESTINATION,
  createAuthURL,
  getAuthDestination,
  getRequestedPath,
} from './redirects';

const SessionLoading: FC = () => (
  <main aria-busy="true" aria-live="polite" className={styles.loading}>
    Opening your nook…
  </main>
);

export const ProtectedRoute: FC<PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const { data: session, isPending } = useSession();

  if (isPending) return <SessionLoading />;
  if (!session) {
    return <Navigate replace to={createAuthURL(getRequestedPath(location))} />;
  }
  return children;
};

export const PublicAuthRoute: FC<PropsWithChildren> = ({ children }) => {
  const location = useLocation();
  const { data: session, isPending } = useSession();

  if (isPending) return <SessionLoading />;
  if (session) {
    return <Navigate replace to={getAuthDestination(location.search)} />;
  }
  return children;
};

export const RootRoute: FC = () => {
  const { data: session, isPending } = useSession();
  if (isPending) return <SessionLoading />;
  return <Navigate replace to={session ? DEFAULT_AUTH_DESTINATION : '/auth'} />;
};
