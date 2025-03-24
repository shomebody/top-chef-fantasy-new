// client/src/services/authService.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  getAuth 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthService = {
  // Register a new user
  register: async (userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      // Add display name
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        avatar: '',
        isAdmin: false,
        leagues: [],
        createdAt: new Date()
      });
      
      return {
        _id: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        isAdmin: false
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  // Login user
  login: async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          _id: userCredential.user.uid,
          name: userData.name,
          email: userData.email,
          isAdmin: userData.isAdmin
        };
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Other methods...
};

export default AuthService;