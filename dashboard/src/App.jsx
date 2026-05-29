import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import LiveMapPage from './pages/LiveMapPage';
import AgentsPage from './pages/AgentsPage';
import ClientsPage from './pages/ClientsPage';
import ZonesPage from './pages/ZonesPage';
import VisitsPage from './pages/VisitsPage';
import AlertsPage from './pages/AlertsPage';
import AgentDetailPage from './pages/AgentDetailPage';
import UsersPage from './pages/UsersPage';
import DailyReportPage from './pages/DailyReportPage';
import OverviewPage from './pages/OverviewPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="map" element={<LiveMapPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="zones" element={<ZonesPage />} />
        <Route path="visits" element={<VisitsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="agents/:id" element={<AgentDetailPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="agents/:id/report" element={<DailyReportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
