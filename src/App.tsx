import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Outlet } from '@/packages/ui';
import { Auth, Dev, Diary, Home, Settings, Workspace } from '@/pages';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<Outlet />}>
          <Route index element={<Navigate to="/diary" />} />
          <Route path="home" element={<Home />} />
          <Route path="dev" element={<Dev />} />
          <Route path="diary" element={<Diary />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
