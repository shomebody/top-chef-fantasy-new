// client/src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const { isAuthenticated, loading } = useAuth();
  console.log('App render:', { isAuthenticated, loading });

  if (loading) {
    console.log('Rendering LoadingScreen');
    return <div>Loading...</div>; // Simplified loading state
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;