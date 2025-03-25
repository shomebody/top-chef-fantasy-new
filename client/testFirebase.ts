// test-firebase.js in client directory
import { db } from './src/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function testConnection() {
  try {
    console.log('Testing Firebase connection...');
    const snapshot = await getDocs(collection(db, 'test'));
    console.log('Connection successful!', snapshot.size);
  } catch (error) {
    console.error('Firebase connection error:', error);
  }
}

testConnection();