// server/src/config/firebase.js
import firebaseAdmin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Path to service account file
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

let credential;

try {
  // Try to read service account file
  if (fs.existsSync(serviceAccountPath)) {
    console.log('Using Firebase service account from file');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    credential = firebaseAdmin.credential.cert(serviceAccount);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Using Firebase service account from environment variable');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = firebaseAdmin.credential.cert(serviceAccount);
  } else {
    console.warn('Using application default credentials. Set up proper service account for production.');
    credential = firebaseAdmin.credential.applicationDefault();
  }
  
  // Initialize Firebase Admin SDK if not already initialized
  if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
      credential,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    console.log('Firebase Admin initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

// Export Firebase Admin services
export const auth = firebaseAdmin.auth();
export const db = firebaseAdmin.firestore();
export const storage = firebaseAdmin.storage();
export default firebaseAdmin;