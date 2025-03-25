// client/src/services/authService.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
  confirmPasswordReset,
  verifyPasswordResetCode,
  applyActionCode,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  type UserCredential,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const getToken = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  try {
    const token = await currentUser.getIdToken();
    console.debug('Token retrieved', { userId: currentUser.uid });
    return token;
  } catch (error: unknown) {
    console.error('Error getting token', { error: String(error) });
    return null;
  }
};

interface UserData {
  email: string;
  password: string;
  name: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
}

const AuthService = {
  register: async (userData: UserData): Promise<UserProfile> => {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      await updateFirebaseProfile(userCredential.user, {
        displayName: userData.name,
      });

      await sendEmailVerification(userCredential.user);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: userData.name,
        email: userData.email,
        avatar: userCredential.user.photoURL || '',
        isAdmin: false,
        leagues: [],
        authProvider: 'email',
        createdAt: serverTimestamp(),
      });

      console.info('User registered successfully', {
        userId: userCredential.user.uid,
        email: userData.email,
      });

      return {
        _id: userCredential.user.uid,
        name: userData.name,
        email: userData.email,
        isAdmin: false,
        emailVerified: false,
      };
    } catch (error: unknown) {
      console.error('Registration error', {
        error: String(error),
        email: userData?.email,
      });
      throw error;
    }
  },

  signInWithGoogle: async (): Promise<UserProfile> => {
    try {
      const provider = new GoogleAuthProvider();
      let userCredential: UserCredential;

      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupError: unknown) {
        if ((popupError as any).code === 'auth/popup-blocked') {
          console.warn('Popup blocked, falling back to redirect');
          await signInWithRedirect(auth, provider);
          return new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
              if (user) {
                unsubscribe();
                handleGoogleUser(user).then(resolve).catch(reject);
              }
            }, (error) => {
              unsubscribe();
              reject(error);
            });
          });
        } else {
          throw popupError;
        }
      }

      return await handleGoogleUser(userCredential.user);
    } catch (error: unknown) {
      console.error('Google sign-in error', { error: String(error) });
      throw error;
    }
  },

  login: async (email: string, password: string): Promise<UserProfile> => {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.info('User logged in', { userId: userCredential.user.uid, email });
        return {
          _id: userCredential.user.uid,
          name: userData.name as string,
          email: userData.email as string,
          isAdmin: (userData.isAdmin as boolean) || false,
          emailVerified: userCredential.user.emailVerified,
        };
      } else {
        console.warn('User profile not found in Firestore', { userId: userCredential.user.uid });
        throw new Error('User profile not found');
      }
    } catch (error: unknown) {
      console.error('Login error', { error: String(error), email });
      throw error;
    }
  },

  logout: async (): Promise<boolean> => {
    try {
      await signOut(auth);
      console.info('User logged out');
      return true;
    } catch (error: unknown) {
      console.error('Logout error', { error: String(error) });
      throw error;
    }
  },

  sendPasswordResetEmail: async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.info('Password reset email sent', { email });
      return true;
    } catch (error: unknown) {
      console.error('Password reset error', { error: String(error), email });
      throw error;
    }
  },

  confirmPasswordReset: async (code: string, newPassword: string): Promise<boolean> => {
    try {
      await confirmPasswordReset(auth, code, newPassword);
      console.info('Password reset confirmed');
      return true;
    } catch (error: unknown) {
      console.error('Confirm password reset error', { error: String(error) });
      throw error;
    }
  },

  verifyPasswordResetCode: async (code: string): Promise<string> => {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      console.info('Password reset code verified', { email });
      return email;
    } catch (error: unknown) {
      console.error('Verify password reset code error', { error: String(error) });
      throw error;
    }
  },

  sendVerificationEmail: async (): Promise<boolean> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      await sendEmailVerification(currentUser);
      console.info('Verification email sent', { userId: currentUser.uid });
      return true;
    } catch (error: unknown) {
      console.error('Send verification email error', { error: String(error) });
      throw error;
    }
  },

  verifyEmail: async (actionCode: string): Promise<boolean> => {
    try {
      await applyActionCode(auth, actionCode);
      console.info('Email verified with action code');
      return true;
    } catch (error: unknown) {
      console.error('Email verification error', { error: String(error) });
      throw error;
    }
  },

  updateProfile: async (userData: { name?: string; avatar?: string }): Promise<Partial<UserProfile>> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      const updateData: { name?: string; avatar?: string } = {};
      if (userData.name) {
        await updateFirebaseProfile(currentUser, {
          displayName: userData.name,
        });
        updateData.name = userData.name;
      }

      if (userData.avatar) {
        await updateFirebaseProfile(currentUser, {
          photoURL: userData.avatar,
        });
        updateData.avatar = userData.avatar;
      }

      if (Object.keys(updateData).length > 0) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, updateData);
        console.info('User profile updated', { userId: currentUser.uid, updates: updateData });
      }

      return {
        _id: currentUser.uid,
        ...updateData,
      };
    } catch (error: unknown) {
      console.error('Update profile error', { error: String(error) });
      throw error;
    }
  },

  getCurrentUser: async (): Promise<UserProfile | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.debug('No current user found');
        return null;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        console.debug('Current user fetched', { userId: currentUser.uid });
        return {
          _id: currentUser.uid,
          name: (userDoc.data().name as string) || currentUser.displayName || '',
          email: (userDoc.data().email as string) || currentUser.email || '',
          isAdmin: (userDoc.data().isAdmin as boolean) || false,
          emailVerified: currentUser.emailVerified,
        };
      }
      console.warn('User document not found for current user', { userId: currentUser.uid });
      return null;
    } catch (error: unknown) {
      console.error('Get current user error', { error: String(error) });
      throw error;
    }
  },

  onAuthStateChanged: (callback: (user: User | null) => void): (() => void) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          console.debug('Auth state changed: user signed in', { userId: user.uid });
        } else {
          console.debug('Auth state changed: user signed out');
        }
        callback(user);
      },
      (error) => {
        console.error('Auth state observer error', { error: String(error) });
      }
    );
    return unsubscribe;
  },
};

// Helper function for Google user handling
async function handleGoogleUser(user: User): Promise<UserProfile> {
  const userDoc = await getDoc(doc(db, 'users', user.uid));

  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      name: user.displayName,
      email: user.email,
      avatar: user.photoURL || '',
      isAdmin: false,
      leagues: [],
      authProvider: 'google',
      createdAt: serverTimestamp(),
    });
    console.info('New Google user created', { userId: user.uid });
  } else {
    console.info('Google user signed in', { userId: user.uid });
  }

  return {
    _id: user.uid,
    name: user.displayName || '',
    email: user.email || '',
    isAdmin: userDoc.exists() ? (userDoc.data().isAdmin as boolean) || false : false,
    emailVerified: user.emailVerified,
  };
}

// Export both named and default for flexibility
export const authService = AuthService;
export default AuthService;