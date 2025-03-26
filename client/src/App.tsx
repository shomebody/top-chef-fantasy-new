// client/src/App.tsx
import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './components/ui/LoadingScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leagues from './pages/Leagues';
import LeagueDetail from './pages/LeagueDetail';
import ChefRoster from './pages/ChefRoster';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { io } from 'socket.io-client';
import { getAuth, onIdTokenChanged } from 'firebase/auth';

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    let socket;
    const auth = getAuth();

    const connectSocket = async () => {
      if (!isAuthenticated || !auth.currentUser) {
        console.log('No authenticated user, not connecting to socket');
        return;
      }

      try {
        const token = await auth.currentUser.getIdToken();
        console.log('Connecting to socket with Firebase token');
        socket = io(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || 5000}`, {
          auth: { token },
        });

        socket.on('connect', () => console.log('Socket connected'));
        socket.on('connect_error', (err) => console.error('Socket connection error:', err.message));
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    // Connect socket when authenticated
    connectSocket();

    // Refresh token and reconnect on change
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        const newToken = await user.getIdToken();
        if (socket) {
          socket.auth.token = newToken;
          socket.disconnect().connect();
        } else {
          connectSocket();
        }
      } else if (socket) {
        socket.disconnect();
        socket = null;
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      if (socket) socket.disconnect();
    };
  }, [isAuthenticated]);

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