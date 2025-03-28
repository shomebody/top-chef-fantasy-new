import React, { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import LoadingScreen from './components/ui/LoadingScreen';
import { useAuth } from './hooks/useAuth';
import { logger } from './utils/debugUtils';

// Lazy-load components to improve initial load time
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Leagues = lazy(() => import('./pages/Leagues'));
const LeagueDetail = lazy(() => import('./pages/LeagueDetail'));
const ChefRoster = lazy(() => import('./pages/ChefRoster'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const MainLayout = lazy(() => import('./layouts/MainLayout'));
const AuthLayout = lazy(() => import('./layouts/AuthLayout'));
//dklfjsdlfjkas
// Fallback component for route-level errors - change to a function instead of component
const routeErrorFallback = (error: Error, resetError: () => void) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
      <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
        Something went wrong
      </h2>
      <p className="text-gray-700 dark:text-gray-300 mb-4">
        {error.message || 'An unexpected error occurred'}
      </p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
      >
        Try again
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const { isAuthenticated, loading, error } = useAuth();
  
  useEffect(() => {
    logger.info('App initialized', { 
      prefix: 'App',
      data: { 
        isAuthenticated, 
        environment: import.meta.env.MODE,
        version: import.meta.env.VITE_APP_VERSION || '0.1.0'
      }
    });
    
    // Log any auth errors
    if (error) {
      logger.error('Authentication error', { prefix: 'App', data: error });
    }
  }, [isAuthenticated, error]);

  // Global error boundary for the entire app
  return (
    <ErrorBoundary
      fallback={(error: Error, resetError: () => void) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Application Error
            </h1>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The application has encountered a critical error and cannot continue.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Error details: {error.message}
            </p>
            <button
              onClick={resetError}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      )}
    >
      {loading ? (
        <LoadingScreen />
      ) : (
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={
                isAuthenticated ? <Navigate to="/" /> : 
                <ErrorBoundary fallback={routeErrorFallback}>
                  <Login />
                </ErrorBoundary>
              } />
              <Route path="/register" element={
                isAuthenticated ? <Navigate to="/" /> : 
                <ErrorBoundary fallback={routeErrorFallback}>
                  <Register />
                </ErrorBoundary>
              } />
            </Route>
            
            {/* Protected routes with MainLayout */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={
                <ErrorBoundary fallback={routeErrorFallback}>
                  <Dashboard />
                </ErrorBoundary>
              } />
              <Route path="/leagues" element={
                <ErrorBoundary fallback={routeErrorFallback}>
                  <Leagues />
                </ErrorBoundary>
              } />
              <Route path="/leagues/:id" element={
                <ErrorBoundary fallback={routeErrorFallback}>
                  <LeagueDetail />
                </ErrorBoundary>
              } />
              <Route path="/chefs" element={
                <ErrorBoundary fallback={routeErrorFallback}>
                  <ChefRoster />
                </ErrorBoundary>
              } />
              <Route path="/schedule" element={
                <ErrorBoundary fallback={routeErrorFallback}>
                  <Schedule />
                </ErrorBoundary>
              } />
              <Route path="/settings" element={
                <ErrorBoundary fallback={routeErrorFallback}>
                  <Settings />
                </ErrorBoundary>
              } />
            </Route>
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      )}
    </ErrorBoundary>
  );
};

export default App;