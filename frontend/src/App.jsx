import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import DailyWorkspace from './pages/DailyWorkspace';
import Templates from './pages/Templates';
import Notes from './pages/Notes';
import Profile from './pages/Profile';

import { format } from 'date-fns';

// Placeholder Pages
const Create = () => <Navigate to={`/workspace/${format(new Date(), 'yyyy-MM-dd')}`} replace />;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="workspace/:dateStr" element={<DailyWorkspace />} />
          <Route path="notes" element={<Notes />} />
          <Route path="create" element={<Create />} />
          <Route path="templates" element={<Templates />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;