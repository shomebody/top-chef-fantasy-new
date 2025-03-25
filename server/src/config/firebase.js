import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

let credential;
try {
  // Try to read service account file
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Try environment variable (for deployment)
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credential = admin.credential.cert(serviceAccount);
  } else {
    // Fallback to application default credentials
    console.warn('Using application default credentials. Set up proper service account for production.');
    credential = admin.credential.applicationDefault();
  }
  
  admin.initializeApp({
    credential,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project-id.appspot.com',
  });
  
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error(`Error initializing Firebase Admin: ${error.message}`, { stack: error.stack });
  throw error; // Re-throw to prevent server from starting with broken Firebase
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export default admin;