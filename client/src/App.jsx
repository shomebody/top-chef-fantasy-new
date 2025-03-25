// client/src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { LeagueProvider } from './context/LeagueContext';
import { ChefProvider } from './context/ChefContext';
import { UserProvider } from './context/UserContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import ChefRoster from './pages/ChefRoster';
import Leagues from './pages/Leagues';
import LeagueDetail from './pages/LeagueDetail';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';

const App = () => {
  const { isAuthenticated = false, loading = true, user = null, error = null } = useAuth();
  const { theme = 'light' } = useTheme();
  const [appReady, setAppReady] = useState(false);

  // Debug environment and authentication
  useEffect(() => {
    console.group('App Environment Check');
    console.log('API URL:', import.meta.env.VITE_API_URL);
    console.log('Socket URL:', import.meta.env.VITE_SOCKET_URL);
    
    // Test localStorage
    try {
      localStorage.setItem('test-key', 'test-value');
      const testValue = localStorage.getItem('test-key');
      console.log('LocalStorage working:', testValue === 'test-value');
      localStorage.removeItem('test-key');
    } catch (err) {
      console.error('LocalStorage error:', err);
    }
    
    // Check authentication state
    const token = localStorage.getItem('token');
    console.log('Token in storage:', !!token);
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 10) + '...');
    }
    
    console.groupEnd();
  }, []);

  // Debug auth state changes
  useEffect(() => {
    console.group('Auth State Update');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('loading:', loading);
    console.log('user:', user);
    console.log('error:', error);
    console.groupEnd();
  }, [isAuthenticated, loading, user, error]);

  useEffect(() => {
    if (!loading) {
      console.log('Auth loading complete, setting appReady timer');
      const timer = setTimeout(() => {
        setAppReady(true);
        console.log('App ready set to true');
      }, 300);
      return () => {
        clearTimeout(timer);
        console.log('App ready timer cleared');
      };
    }
  }, [loading]);

  if (loading || !appReady) {
    console.log('Rendering LoadingScreen - loading:', loading, 'appReady:', appReady);
    return <LoadingScreen />;
  }

  console.log('Rendering main App - authenticated:', isAuthenticated);
  return (
    <div className={`app ${theme === 'dark' ? 'dark' : ''}`}>
      <UserProvider>
        <LeagueProvider>
          <ChefProvider>
            <Routes>
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route
                  path="/login"
                  element={isAuthenticated ? <Navigate to="/" /> : <Login />}
                />
                <Route
                  path="/register"
                  element={isAuthenticated ? <Navigate to="/" /> : <Register />}
                />
              </Route>
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/chefs" element={<ChefRoster />} />
                  <Route path="/leagues" element={<Leagues />} />
                  <Route path="/leagues/:id" element={<LeagueDetail />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ChefProvider>
        </LeagueProvider>
      </UserProvider>
    </div>
  );
};

export default App;