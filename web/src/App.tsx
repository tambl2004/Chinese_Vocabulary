import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { ChinaPage } from './pages/ChinaPage';
import { EnglishPage } from './pages/EnglishPage';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/china" element={<ChinaPage />} />
        <Route path="/english" element={<EnglishPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        {/* Redirect from any other path to /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
