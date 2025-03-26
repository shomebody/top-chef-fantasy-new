// client/src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/ui/LoadingScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leagues from './pages/Leagues'; // This is a component, not a variable
import LeagueDetail from './pages/LeagueDetail';
import ChefRoster from './pages/ChefRoster';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes with AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/" />}
        />
      </Route>

      {/* Protected routes with MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/leagues/:id" element={<LeagueDetail />} />
          <Route path="/chefs" element={<ChefRoster />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Default redirect and catch-all */}
      <Route index element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;