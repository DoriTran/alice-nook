import type { FC, PropsWithChildren } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { AdPageLoading } from '@/packages/base';
import { useSettingsStore } from '@/store/settings/store';

import { useSession } from './auth-client';
import {
  DEFAULT_AUTH_DESTINATION,
  createAuthURL,
  getAuthDestination,
  getRequestedPath,
} from './redirects';

const SessionLoading: FC = () => <AdPageLoading message="Opening your nook" />;

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
  const source = useSettingsStore('diaryDataSource');
  if (isPending) return <SessionLoading />;
  return (
    <Navigate
      replace
      to={
        session
          ? DEFAULT_AUTH_DESTINATION
          : source === 'local'
            ? '/diary'
            : '/auth'
      }
    />
  );
};
