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
import { io, Socket } from 'socket.io-client';
import { getAuth, onIdTokenChanged, User } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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
    let socket: Socket | undefined;
    const auth = getAuth();

    // Test Storage initialization
    try {
      const storage = getStorage();
      console.log('Firebase Storage initialized successfully:', storage);
    } catch (error) {
      console.error('Firebase Storage initialization failed:', error);
    }

    const connectSocket = async (): Promise<void> => {
      if (!isAuthenticated || !auth.currentUser) {
        console.log('No authenticated user, not connecting to socket');
        return;
      }
      try {
        const token = await auth.currentUser.getIdToken();
        console.log('Connecting to socket with Firebase token');
        socket = io(`http://localhost:${import.meta.env.VITE_BACKEND_PORT || '5000'}`, {
          auth: { token },
        });
        socket.on('connect', () => console.log('Socket connected'));
        socket.on('connect_error', (err: Error) =>
          console.error('Socket connection error:', err.message)
        );
      } catch (error: unknown) {
        console.error(
          'Socket initialization error:',
          error instanceof Error ? error.message : String(error)
        );
      }
    };

    void connectSocket();

    const unsubscribe = onIdTokenChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const newToken = await user.getIdToken();
          if (socket) {
            socket.auth = { token: newToken } as { token: string };
            socket.disconnect().connect();
          } else {
            await connectSocket();
          }
        } catch (error) {
          console.error('Token refresh error:', error);
        }
      } else if (socket) {
        socket.disconnect();
        socket = undefined;
      }
    });

    return (): void => {
      unsubscribe();
      if (socket) socket.disconnect();
    };
  }, [isAuthenticated]);

  if (loading) {
    return <LoadingScreen />;
  }

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