import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import { useTheme } from './hooks/useTheme.jsx';
import { LeagueProvider } from './context/LeagueContext.jsx';

// Layouts
import MainLayout from './layouts/MainLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import ChefRoster from './pages/ChefRoster.jsx';
import Leagues from './pages/Leagues.jsx';
import LeagueDetail from './pages/LeagueDetail.jsx';
import Schedule from './pages/Schedule.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import LoadingScreen from './components/ui/LoadingScreen.jsx';

const App = () => {
  const { isAuthenticated = false, loading = true, user = null, error = null } = useAuth(); // Defaults for React 19
  const { theme = 'light' } = useTheme(); // Default for safety
  const [appReady, setAppReady] = useState(false);

  // Debug environment and authentication
  useEffect(() => {
    console.group('App Environment Check');
    console.log('React version:', React.version);
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

    return () => {
      // Cleanup function
      console.log('App environment check cleanup');
    };
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
      <LeagueProvider>
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
      </LeagueProvider>
    </div>
  );
};

export default App;