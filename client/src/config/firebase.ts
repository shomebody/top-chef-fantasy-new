// src/config/firebase.ts
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  type Auth
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  getFirestore,
  type Firestore
} from 'firebase/firestore';
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage
} from 'firebase/storage';
import { logger } from '../utils/debugUtils';

// Determine environment
const isLocalDev = import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_EMULATORS === 'true';
const isPersistenceEnabled = import.meta.env.VITE_ENABLE_PERSISTENCE !== 'false';
const useSessionPersistence = import.meta.env.VITE_USE_SESSION_PERSISTENCE === 'true';

// Firebase configuration from typed environment variables
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID'
];

// Check for missing required variables
requiredVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  logger.info('Initializing Firebase', { prefix: 'Firebase', data: { 
    isLocalDev, 
    projectId: firebaseConfig.projectId 
  }});

  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Setup auth persistence
  if (useSessionPersistence) {
    setPersistence(auth, browserSessionPersistence)
      .then(() => logger.info('Auth using session persistence', { prefix: 'Firebase' }))
      .catch(err => logger.error('Error setting auth persistence', { prefix: 'Firebase', data: err }));
  } else {
    setPersistence(auth, browserLocalPersistence)
      .then(() => logger.info('Auth using local persistence', { prefix: 'Firebase' }))
      .catch(err => logger.error('Error setting auth persistence', { prefix: 'Firebase', data: err }));
  }

  // Setup Firestore persistence
  if (isPersistenceEnabled) {
    // Try multi-tab persistence first, fall back to single-tab
    enableMultiTabIndexedDbPersistence(db)
      .then(() => logger.info('Firestore multi-tab persistence enabled', { prefix: 'Firebase' }))
      .catch((err) => {
        // If we can't enable multi-tab, try normal persistence
        if (err.code === 'failed-precondition') {
          logger.warn('Multi-tab persistence not available, trying single-tab', { prefix: 'Firebase' });
          
          enableIndexedDbPersistence(db)
            .then(() => logger.info('Firestore single-tab persistence enabled', { prefix: 'Firebase' }))
            .catch((err) => {
              logger.error('Error enabling Firestore persistence', { prefix: 'Firebase', data: err });
            });
        } else {
          logger.error('Error enabling Firestore persistence', { prefix: 'Firebase', data: err });
        }
      });
  }

  // Connect to emulators in local development
  if (isLocalDev) {
    logger.info('Connecting to Firebase emulators', { prefix: 'Firebase' });
    
    // Auth emulator usually runs on port 9099
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    
    // Firestore emulator usually runs on port 8080
    connectFirestoreEmulator(db, 'localhost', 8080);
    
    // Storage emulator usually runs on port 9199
    connectStorageEmulator(storage, 'localhost', 9199);
  }

  logger.info('Firebase initialized successfully', { prefix: 'Firebase' });
} catch (error) {
  logger.error('Error initializing Firebase', { prefix: 'Firebase', data: error, trace: true });
  throw error;
}

export { app, auth, db, storage };
