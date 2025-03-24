import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  signInWithCustomToken
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import api from './api';

const AuthService = {
  register: async (userData) => {
    try {
      // First try to register with our API
      const response = await api.post('/api/auth/register', userData);
      
      // Sign in with custom token from API
      if (response.data && response.data.token) {
        await signInWithCustomToken(auth, response.data.token);
        
        // Return user data from API
        return {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          isAdmin: response.data.isAdmin || false
        };
      } else {
        throw new Error('Registration successful but no token received');
      }
    } catch (apiError) {
      console.error('API registration error:', apiError);
      
      // Fallback to direct Firebase registration if API fails
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          userData.email, 
          userData.password
        );
        
        await firebaseUpdateProfile(userCredential.user, {
          displayName: userData.name
        });
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userData.name,
          email: userData.email,
          avatar: '',
          isAdmin: false,
          leagues: [],
          createdAt: new Date().toISOString()
        });
        
        return {
          _id: userCredential.user.uid,
          name: userData.name,
          email: userData.email,
          isAdmin: false
        };
      } catch (firebaseError) {
        console.error('Firebase registration error:', firebaseError);
        throw firebaseError;
      }
    }
  },
  
  login: async (email, password) => {
    try {
      // First try to login with our API
      const response = await api.post('/api/auth/login', { email, password });
      
      // Sign in with custom token from API
      if (response.data && response.data.token) {
        await signInWithCustomToken(auth, response.data.token);
        
        // Return user data from API
        return {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          isAdmin: response.data.isAdmin || false
        };
      } else {
        throw new Error('Login successful but no token received');
      }
    } catch (apiError) {
      console.error('API login error:', apiError);
      
      // Fallback to direct Firebase login if API fails
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            _id: userCredential.user.uid,
            name: userData.name,
            email: userData.email,
            isAdmin: userData.isAdmin || false
          };
        } else {
          throw new Error('User profile not found');
        }
      } catch (firebaseError) {
        console.error('Firebase login error:', firebaseError);
        throw firebaseError;
      }
    }
  },
  
  logout: async () => {
    localStorage.removeItem('token');
    return signOut(auth);
  },
  
  getCurrentUser: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        return {
          _id: currentUser.uid,
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  updateProfile: async (userData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      
      // First try to update with our API
      try {
        const response = await api.put('/api/auth/profile', userData);
        
        if (response.data && response.data.token) {
          // If we get a new token, sign in with it
          await signInWithCustomToken(auth, response.data.token);
        }
        
        return {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          isAdmin: response.data.isAdmin || false,
          avatar: response.data.avatar || ''
        };
      } catch (apiError) {
        console.error('API update profile error:', apiError);
        
        // Fallback to direct Firebase update
        const userRef = doc(db, 'users', currentUser.uid);
        
        const updateData = {};
        if (userData.name) updateData.name = userData.name;
        if (userData.email) updateData.email = userData.email;
        if (userData.avatar) updateData.avatar = userData.avatar;
        
        if (Object.keys(updateData).length > 0) {
          await updateDoc(userRef, updateData);
          
          if (userData.name) {
            await firebaseUpdateProfile(currentUser, {
              displayName: userData.name
            });
          }
        }
        
        return {
          _id: currentUser.uid,
          ...updateData
        };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};

export default AuthService;