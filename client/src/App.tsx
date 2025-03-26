// client/src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import LoadingScreen from './components/ui/LoadingScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leagues from './pages/Leagues'; // Added this import
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
  const [appReady, setAppReady] = useState(false);
  
  useEffect(() => {
    // Ensure auth state is fully loaded before showing the app
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth State Update');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('loading:', loading);
      console.log('user:', user);
      
      if (!loading) {
        console.log('Auth loading complete, setting appReady timer');
        // Short delay to ensure all auth hooks are fully processed
        const timer = setTimeout(() => {
          console.log('App ready set to true');
          setAppReady(true);
        }, 100);
        return () => clearTimeout(timer);
      }
    });
    
    return () => unsubscribe();
  }, [loading, isAuthenticated]);
  
  if (loading || !appReady) {
    console.log('Rendering LoadingScreen - loading:', loading, 'appReady:', appReady);
    return <LoadingScreen />;
  }
  
  console.log('Rendering main App - authenticated:', isAuthenticated);
  
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
      </Route>
      
      {/* Protected routes */}
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
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;