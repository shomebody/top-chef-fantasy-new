import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthService = {
  register: async (userData) => {
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
  
  login: async (email, password) => {
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
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  logout: async () => {
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
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};

export default AuthService;