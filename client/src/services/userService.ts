// client/src/services/userService.js
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import api from './api.js';

const UserService = {
  // Get user profile - Firestore implementation
  getUserProfile: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      return {
        _id: userDoc.id,
        ...userDoc.data()
      };
    } catch (error) {
      console.error('Error fetching user from Firestore:', error);
      
      // Fallback to API
      const response = await api.get('/api/auth/profile');
      return response.data;
    }
  },
  
  // Update user profile - Firestore implementation
  updateUserProfile: async (userData) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No user logged in');
      
      const updateData = {};
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