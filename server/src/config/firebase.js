import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin with service account
// The service account key should be stored securely
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

// Initialize the app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Export the admin instances
const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage();

export { admin, auth, db, storage };