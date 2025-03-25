import { auth, db,} from '../firebaseConfig';

export async function testFirebase() { // Added export
  try {
    console.log('Firebase App Initialized:', !!auth.app);
    console.log('Auth Service:', !!auth);
    console.log('Firestore Service:', !!db);
  } catch (error) {
    console.error('Firebase Initialization Error:', error);
  }
}

testFirebase(); // Still calls it immediately for testing