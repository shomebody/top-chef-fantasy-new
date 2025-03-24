// server/src/config/firebase.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
  });
} catch (error) {
  console.error(`Error initializing Firebase Admin: ${error.message}`, { stack: error.stack });
  process.exit(1);
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
export default admin; // Default export for admin