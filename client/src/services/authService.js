// client/src/services/authService.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile,
  signInWithCustomToken,
  getIdToken
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js'; // Adjusted path if needed
import api from './api.js';

// Named export for token retrieval
export const getToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    return await getIdToken(currentUser);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const AuthService = {
  register: async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      
      if (response.data && response.data.token) {
        await signInWithCustomToken(auth, response.data.token);
        return {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          isAdmin: response.data.isAdmin || false,
        };
      } else {
        throw new Error('Registration successful but no token received');
      }
    } catch (apiError) {
      console.error('API registration error:', apiError);
      
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
          isAdmin: false,
        };
      } catch (firebaseError) {
        console.error('Firebase registration error:', firebaseError);
        throw firebaseError;
      }
    }
  },
  
  login: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data && response.data.token) {
        await signInWithCustomToken(auth, response.data.token);
        return {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          isAdmin: response.data.isAdmin || false,
        };
      } else {
        throw new Error('Login successful but no token received');
      }
    } catch (apiError) {
      console.error('API login error:', apiError);
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            _id: userCredential.user.uid,
            name: userData.name,
            email: userData.email,
            isAdmin: userData.isAdmin || false,
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
          ...userDoc.data(),
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
      
      try {
        const response = await api.put('/api/auth/profile', userData);
        
        if (response.data && response.data.token) {
          await signInWithCustomToken(auth, response.data.token);
        }
        
        return {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          isAdmin: response.data.isAdmin || false,
          avatar: response.data.avatar || '',
        };
      } catch (apiError) {
        console.error('API update profile error:', apiError);
        
        const userRef = doc(db, 'users', currentUser.uid);
        const updateData = {};
        if (userData.name) updateData.name = userData.name;
        if (userData.email) updateData.email = userData.email;
        if (userData.avatar) updateData.avatar = userData.avatar;
        
        if (Object.keys(updateData).length > 0) {
          await updateDoc(userRef, updateData);
          
          if (userData.name) {
            await firebaseUpdateProfile(currentUser, {
              displayName: userData.name,
            });
          }
        }
        
        return {
          _id: currentUser.uid,
          ...updateData,
        };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
};

export default AuthService;