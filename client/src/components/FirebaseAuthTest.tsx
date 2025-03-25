// client/src/components/FirebaseAuthTest.tsx
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';

const FirebaseAuthTest: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('Checking auth...');
  const [apiStatus, setApiStatus] = useState<string>('Not tested');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          setAuthStatus(`Authenticated as ${user.email} (${user.uid})`);
          console.log('Firebase token:', token.substring(0, 20) + '...');
        } catch (err) {
          setAuthStatus('Error getting token');
          setError(err instanceof Error ? err.message : String(err));
        }
      } else {
        setAuthStatus('Not authenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const testApiCall = async () => {
    try {
      setApiStatus('Testing...');
      const response = await api.get('/auth/profile');
      setApiStatus(`Success: ${response.status} - ${JSON.stringify(response.data)}`);
    } catch (err) {
      console.error('API test error:', err);
      setApiStatus('Failed');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      <h2 className="text-lg font-semibold mb-2">Firebase Auth Test</h2>
      <p className="mb-2">Auth Status: <span className="font-mono">{authStatus}</span></p>
      <p className="mb-2">API Status: <span className="font-mono">{apiStatus}</span></p>
      
      <button
        onClick={testApiCall}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        data-testid="test-api-button"
      >
        Test Protected API
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default FirebaseAuthTest;