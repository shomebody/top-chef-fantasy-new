import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import api from './api.js';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
  createdAt?: Date;
  avatar?: string;
  [key: string]: any;
}

const UserService = {
  // Get user profile - Firestore implementation
  getUserProfile: async (userId: string): Promise<UserProfile> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      return {
        _id: userDoc.id,
        ...userDoc.data()
      } as UserProfile;
    } catch (error) {
      console.error('Error fetching user from Firestore:', error);
      
      // Fallback to API
      const response = await api.get('/api/auth/profile');
      return response.data;
    }
  },
  
  // Update user profile - Firestore implementation
  updateUserProfile: async (userData: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      
      const updateData: Record<string, any> = {};
      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email.toLowerCase();
      if (userData.avatar) updateData.avatar = userData.avatar;
      
      // Update Firestore document
      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'users', currentUser.uid), updateData);
      }
      
      // Update Firebase Auth profile if name provided
      if (userData.name) {
        await firebaseUpdateProfile(currentUser, {
          displayName: userData.name
        });
      }
      
      return {
        _id: currentUser.uid,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating user in Firestore:', error);
      
      // Fallback to API
      const response = await api.put('/api/auth/profile', userData);
      return response.data;
    }
  }
};

export default UserService;