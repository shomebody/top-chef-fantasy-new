import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

function FirebaseTest() {
  const [status, setStatus] = useState('Testing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        console.log('Testing Firebase connection...');
        // Try to get any collection
        const snapshot = await getDocs(collection(db, 'users'));
        console.log('Connection successful!', snapshot.size);
        setStatus(`Connection successful! Found ${snapshot.size} documents.`);
      } catch (error) {
        console.error('Firebase connection error:', error);
        setError(error.message);
        setStatus('Connection failed');
      }
    }

    testConnection();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h2 className="text-lg font-semibold mb-2">Firebase Connection Test</h2>
      <p className="mb-2">Status: {status}</p>
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}

export default FirebaseTest;