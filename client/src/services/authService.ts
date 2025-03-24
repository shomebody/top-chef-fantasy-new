// client/src/services/authService.ts
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  UserCredential,
  User,
} from 'firebase/auth';
import { getIdToken } from 'firebase/auth';

// Token management functions
export const getToken = (): string | null => localStorage.getItem('token');
export const setToken = (token: string): void => localStorage.setItem('token', token);
export const removeToken = (): void => localStorage.removeItem('token');

// Define types for user data
interface UserData {
  email: string;
  password: string;
  displayName?: string;
}

// Auth service object
const AuthService = {
  // Register a new user
  register: async (userData: UserData): Promise<{ user: User; token: string }> => {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      const token = await getIdToken(userCredential.user);
      setToken(token);
      if (userData?.displayName) {
        await auth.updateCurrentUser({ ...userCredential.user, displayName: userData.displayName });
      }
      return { user: userCredential.user, token };
    } catch (error) {
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdToken(userCredential.user);
      setToken(token);
      return { user: userCredential.user, token };
    } catch (error) {
      throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Logout user
  logout: (): void => {
    signOut(auth)
      .then(() => removeToken())
      .catch((error) => {
        console.error('Logout failed:', error);
      });
  },

  // Get current user profile
  getCurrentUser: async (): Promise<User | null> => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');
    return user;
  },

  // Update user profile
  updateProfile: async (userData: Partial<UserData>): Promise<void> => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user found');
    try {
      await user.updateProfile({
        displayName: userData.displayName ?? user.displayName,
      });
    } catch (error) {
      throw new Error(`Profile update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => !!getToken(),
};

export default AuthService;