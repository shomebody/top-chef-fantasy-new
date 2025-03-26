// client/src/App.tsx
import { useEffect, useState } from 'react';
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
import { getAuth } from 'firebase/auth';

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Uncaught error caught by ErrorBoundary:', event.error);
      setHasError(true);
      setError(event.error?.message || 'An unexpected error occurred');
    };
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setError(event.reason?.message || 'Unhandled promise rejection');
    };
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
        <p className="mt-2 text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    );
  }
  return <>{children}</>;
};

const App = (): React.JSX.Element => {
  const { isAuthenticated, loading } = useAuth();

  console.log('App render:', { isAuthenticated, loading });

  useEffect(() => {
    console.log('App effect running');
    const auth = getAuth();
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      console.log('Auth state changed:', user ? 'User authenticated' : 'No authenticated user');
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    console.log('Rendering LoadingScreen');
    return <LoadingScreen />;
  }

  console.log('Rendering Routes, isAuthenticated:', isAuthenticated);

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        </Route>
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
        <Route index element={<Navigate to={isAuthenticated ? '/' : '/login'} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;