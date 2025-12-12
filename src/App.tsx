import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Stores from './pages/Stores';
import Stations from './pages/Stations';
import ShiftCodes from './pages/ShiftCodes';
import Roster from './pages/Roster';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="stores" element={<Stores />} />
          <Route path="stations" element={<Stations />} />
          <Route path="shift-codes" element={<ShiftCodes />} />
          <Route path="roster" element={<Roster />} />
          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
