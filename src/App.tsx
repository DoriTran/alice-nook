import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute, PublicAuthRoute, RootRoute } from '@/auth';
import { Outlet } from '@/packages/ui';
import { Auth, Dev, Diary, Home, Settings, Workspace } from '@/pages';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicAuthRoute>
              <Auth />
            </PublicAuthRoute>
          }
        />
        <Route path="/" element={<Outlet />}>
          <Route index element={<RootRoute />} />
          <Route
            path="home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="dev" element={<Dev />} />
          <Route
            path="diary"
            element={
              <ProtectedRoute>
                <Diary />
              </ProtectedRoute>
            }
          />
          <Route
            path="workspace"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
