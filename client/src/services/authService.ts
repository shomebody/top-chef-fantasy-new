import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getIdToken,
  UserCredential,
  User as FirebaseUser,
  updateProfile as firebaseUpdateProfile,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// Types
interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  emailVerified: boolean;
}

interface RegistrationData {
  name: string;
  email: string;
  password: string;
}

interface UpdateProfileData {
  name?: string;
  email?: string;
  password?: string;
  avatar?: string;
}

/**
 * Maps Firebase error codes to user-friendly messages
 * @param {string} errorCode - The error code from Firebase
 * @returns {string} - A user-friendly error message
 */
function getAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Email address is already in use';
    case 'auth/invalid-email':
      return 'Email address is invalid';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/invalid-action-code':
      return 'This link is invalid or has expired';
    case 'auth/expired-action-code':
      return 'This link has expired';
    case 'auth/requires-recent-login':
      return 'Please log out and log in again to perform this action';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/operation-not-allowed':
      return 'Operation not allowed';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again';
    case 'auth/invalid-credential':
      return 'Invalid credentials provided';
    default:
      return 'An error occurred. Please try again later';
  }
}

export const authService = {
  /**
   * Register a new user
   * @param {RegistrationData} userData - User registration details including name, email, and password
   * @returns {Promise<UserProfile>} - Promise that resolves with the user profile
   */
  register: async (userData: RegistrationData): Promise<UserProfile> => {
    try {
      const lowerCaseEmail = userData.email.toLowerCase();
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        lowerCaseEmail,
        userData.password
      );
      await firebaseUpdateProfile(userCredential.user, { displayName: userData.name });
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        name: userData.name,
        email: lowerCaseEmail,
        avatar: '',
        isAdmin: false,
        leagues: [],
        emailVerified: userCredential.user.emailVerified,
        createdAt: new Date().toISOString(),
      });
      return {
        _id: userCredential.user.uid,
        name: userData.name,
        email: lowerCaseEmail,
        avatar: '',
        isAdmin: false,
        emailVerified: userCredential.user.emailVerified,
      };
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  },

  /**
   * Log in an existing user
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<UserProfile>} - Promise that resolves with the user profile
   */
  login: async (email: string, password: string): Promise<UserProfile> => {
    try {
      const lowerCaseEmail = email.toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, lowerCaseEmail, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create the document with default values if it doesn't exist
        await setDoc(userDocRef, {
          name: userCredential.user.displayName || '',
          email: lowerCaseEmail,
          avatar: '',
          isAdmin: false,
          leagues: [],
          emailVerified: userCredential.user.emailVerified,
          createdAt: new Date().toISOString(),
        });
      } else {
        const userData = userDoc.data();
        // Update emailVerified if it has changed
        if (userData.emailVerified !== userCredential.user.emailVerified) {
          await updateDoc(userDocRef, {
            emailVerified: userCredential.user.emailVerified,
          });
        }
      }

      const userData = (await getDoc(userDocRef)).data() || {};
      return {
        _id: userCredential.user.uid,
        name: userData.name || userCredential.user.displayName || '',
        email: userData.email || lowerCaseEmail,
        isAdmin: userData.isAdmin || false,
        avatar: userData.avatar || '',
        emailVerified: userCredential.user.emailVerified,
      };
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  },

  /**
   * Log out the current user
   * @returns {Promise<void>} - Promise that resolves when logout is complete
   */
  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to log out');
    }
  },

  /**
   * Update the current user's profile
   * @param {UpdateProfileData} userData - Data to update (name, email, password, avatar)
   * @returns {Promise<UserProfile>} - Promise that resolves with the updated user profile
   */
  updateProfile: async (userData: UpdateProfileData): Promise<UserProfile> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');

      const userRef = doc(db, 'users', currentUser.uid);
      const updateData: Record<string, any> = {};

      if (userData.name) {
        updateData.name = userData.name;
        await firebaseUpdateProfile(currentUser, { displayName: userData.name });
      }

      if (userData.email) {
        // Note: Updating email requires re-authentication. Ensure the user has recently logged in or re-authenticated.
        updateData.email = userData.email.toLowerCase();
      }

      if (userData.password) {
        // Note: Updating password requires re-authentication. Ensure the user has recently logged in or re-authenticated.
        await currentUser.updatePassword(userData.password);
      }

      if (userData.avatar) {
        // Basic URL validation
        try {
          new URL(userData.avatar);
          updateData.avatar = userData.avatar;
        } catch {
          throw new Error('Invalid avatar URL');
        }
      }

      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, updateData);
      }

      const updatedUserDoc = await getDoc(userRef);
      const updatedUserData = updatedUserDoc.data() || {};

      return {
        _id: currentUser.uid,
        name: updatedUserData.name || userData.name || currentUser.displayName || '',
        email: updatedUserData.email || userData.email || currentUser.email || '',
        isAdmin: updatedUserData.isAdmin || false,
        avatar: updatedUserData.avatar || userData.avatar || '',
        emailVerified: currentUser.emailVerified,
      };
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code) || error.message);
    }
  },

  /**
   * Send an email verification to the current user
   * @returns {Promise<void>} - Promise that resolves when the email is sent
   */
  sendEmailVerification: async (): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      await firebaseSendEmailVerification(currentUser);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  },

  /**
   * Send a password reset email
   * @param {string} email - The email address to send the reset link to
   * @returns {Promise<void>} - Promise that resolves when the email is sent
   */
  sendPasswordResetEmail: async (email: string): Promise<void> => {
    try {
      await firebaseSendPasswordResetEmail(auth, email.toLowerCase());
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  },

  /**
   * Confirm a password reset with a code and new password
   * @param {string} code - The reset code from the email
   * @param {string} newPassword - The new password to set
   * @returns {Promise<void>} - Promise that resolves when the password is reset
   */
  confirmPasswordReset: async (code: string, newPassword: string): Promise<void> => {
    try {
      await firebaseConfirmPasswordReset(auth, code, newPassword);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  },

  /**
   * Verify a password reset code
   * @param {string} code - The reset code from the email
   * @returns {Promise<string>} - Promise that resolves with the email associated with the code
   */
  verifyPasswordResetCode: async (code: string): Promise<string> => {
    try {
      return await firebaseVerifyPasswordResetCode(auth, code);
    } catch (error: any) {
      throw new Error(getAuthErrorMessage(error.code));
    }
  },

  /**
   * Get the current user's ID token
   * @returns {Promise<{ token: string | null, error?: string }>} - Promise that resolves with the token or an error
   */
  getToken: async (): Promise<{ token: string | null; error?: string }> => {
    const currentUser = auth.currentUser;
    if (!currentUser) return { token: null };

    try {
      const token = await getIdToken(currentUser);
      return { token };
    } catch (error: any) {
      console.error('Error getting token:', error);
      return { token: null, error: error.message };
    }
  },
};