import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import { useTheme } from './hooks/useTheme.jsx';
import { LeagueProvider } from './context/LeagueContext.jsx'; // Added

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
  const { isAuthenticated = false, loading = true } = useAuth(); // Defaults for React 19
  const { theme = 'light' } = useTheme(); // Default for safety
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setAppReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading || !appReady) {
    return <LoadingScreen />;
  }

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
          <Route path="*" element={<NotFound />} /> {/* Fixed missing asterisk */}
        </Routes>
      </LeagueProvider>
    </div>
  );
};

export default App;