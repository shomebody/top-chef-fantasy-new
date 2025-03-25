import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  confirmPasswordReset,
  verifyPasswordResetCode,
  applyActionCode,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Named export for token retrieval (not needed with Firebase but kept for API compatibility)
export const getToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken();
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

const AuthService = {
  // Register a new user
  register: async (userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });
      
      await sendEmailVerification(userCredential.user);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        avatar: userCredential.user.photoURL || '',
        isAdmin: false,
        leagues: [],
        authProvider: 'email',
        createdAt: serverTimestamp()
      });
      
      return {
        _id: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        isAdmin: false,
        emailVerified: false
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  // Google sign-in
  signInWithGoogle: async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name: userCredential.user.displayName,
          email: userCredential.user.email,
          avatar: userCredential.user.photoURL || '',
          isAdmin: false,
          leagues: [],
          authProvider: 'google',
          createdAt: serverTimestamp()
        });
      }
      
      return {
        _id: userCredential.user.uid,
        name: userCredential.user.displayName,
        email: userCredential.user.email,
        isAdmin: userDoc.exists() ? userDoc.data().isAdmin || false : false,
        emailVerified: userCredential.user.emailVerified
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  },
  
  // User login with email/password
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
          isAdmin: userData.isAdmin || false,
          emailVerified: userCredential.user.emailVerified
        };
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // User logout
  logout: async () => {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  // Password reset request
  sendPasswordResetEmail: async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },
  
  // Confirm password reset with code and new password
  confirmPasswordReset: async (code, newPassword) => {
    try {
      await confirmPasswordReset(auth, code, newPassword);
      return true;
    } catch (error) {
      console.error('Confirm password reset error:', error);
      throw error;
    }
  },
  
  // Verify password reset code
  verifyPasswordResetCode: async (code) => {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      return email;
    } catch (error) {
      console.error('Verify password reset code error:', error);
      throw error;
    }
  },
  
  // Send email verification to current user
  sendVerificationEmail: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      
      await sendEmailVerification(currentUser);
      return true;
    } catch (error) {
      console.error('Send verification email error:', error);
      throw error;
    }
  },
  
  // Apply action code (for email verification)
  verifyEmail: async (actionCode) => {
    try {
      await applyActionCode(auth, actionCode);
      return true;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      
      const updateData = {};
      if (userData.name) {
        await updateProfile(currentUser, {
          displayName: userData.name
        });
        updateData.name = userData.name;
      }
      
      if (userData.avatar) {
        await updateProfile(currentUser, {
          photoURL: userData.avatar
        });
        updateData.avatar = userData.avatar;
      }
      
      // Update Firestore data
      if (Object.keys(updateData).length > 0) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, updateData);
      }
      
      return {
        _id: currentUser.uid,
        ...updateData
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        return {
          _id: currentUser.uid,
          name: userDoc.data().name || currentUser.displayName || '',
          email: userDoc.data().email || currentUser.email || '',
          isAdmin: userDoc.data().isAdmin || false,
          emailVerified: currentUser.emailVerified
        };
      }
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  // Set up auth state observer - for use in AuthContext
  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  }
};

export default AuthService;