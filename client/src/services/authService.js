import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// User profile operations
const AuthService = {
  // Register a new user
  register: async (userData) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      // Add display name
      await firebaseUpdateProfile(userCredential.user, {
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
  
  // Logout user
  logout: async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    try {
      const user = auth.currentUser;
      
      if (user) {
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            _id: user.uid,
            name: userData.name,
            email: userData.email,
            isAdmin: userData.isAdmin
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      // Update display name if provided
      if (userData.name) {
        await firebaseUpdateProfile(user, {
          displayName: userData.name
        });
      }
      
      // Update user document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      
      const updates = {};
      if (userData.name) updates.name = userData.name;
      if (userData.email) updates.email = userData.email;
      
      await updateDoc(userDocRef, updates);
      
      // If password update is requested
      if (userData.password && userData.currentPassword) {
        // For security reasons, Firebase requires re-authentication 
        // before changing password, which would require additional steps
        // This would need more complex implementation
      }
      
      return {
        _id: user.uid,
        name: user.displayName,
        email: user.email
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!auth.currentUser;
  }
};

export default AuthService;