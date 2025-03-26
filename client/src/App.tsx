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
import { SocketProvider } from './context/SocketContext';
import { auth, storage } from './config/firebase'; // Use centralized instances

// Error Boundary Component
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);
      setHasError(true);
      setError(event.error?.message || 'An unexpected error occurred');
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
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

  useEffect(() => {
    // Log Firebase Storage initialization (should only happen once via firebase.ts)
    console.log('Firebase Storage available from firebase.ts:', storage);

    // No socket logic here; handled by SocketProvider
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      if (user) {
        console.log('Auth state changed: User authenticated');
      } else {
        console.log('Auth state changed: No authenticated user');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array since we rely on SocketProvider for socket logic

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <SocketProvider>
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
      </SocketProvider>
    </ErrorBoundary>
  );
};

export default App;