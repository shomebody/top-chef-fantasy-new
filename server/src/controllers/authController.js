import { auth, db } from '../config/firebase.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if user already exists
    const userSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .get();
    
    if (!userSnapshot.empty) {
      res.status(400);
      throw new Error('User already exists');
    }
    
    // Create user in Firebase Auth
    const userCredential = await auth.createUser({
      email: email.toLowerCase(),
      password,
      displayName: name
    });
    
    // Create user document in Firestore
    const userId = userCredential.uid;
    await db.collection('users').doc(userId).set({
      name,
      email: email.toLowerCase(),
      avatar: '',
      isAdmin: false,
      leagues: [],
      createdAt: new Date().toISOString()
    });
    
    // Generate custom token for client auth
    const token = await auth.createCustomToken(userId);
    
    res.status(201).json({
      _id: userId,
      name,
      email: email.toLowerCase(),
      isAdmin: false,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400);
    throw new Error(error.message || 'Invalid user data');
  }
});

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find user by email in Firestore
    const userSnapshot = await db.collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    
    if (userSnapshot.empty) {
      res.status(401);
      throw new Error('Invalid email or password');
    }
    
    // Verify user exists in Firebase Auth
    try {
      const userRecord = await auth.getUserByEmail(email.toLowerCase());
      
      // Generate custom token
      const token = await auth.createCustomToken(userRecord.uid);
      
      // Get user data from Firestore
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      
      res.json({
        _id: userDoc.id,
        name: userData.name,
        email: userData.email,
        isAdmin: userData.isAdmin || false,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(401);
    throw new Error(error.message || 'Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user._id).get();
    
    if (!userDoc.exists) {
      res.status(404);
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    
    res.json({
      _id: userDoc.id,
      name: userData.name,
      email: userData.email,
      isAdmin: userData.isAdmin || false,
      avatar: userData.avatar || ''
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to get user profile');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user._id);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      res.status(404);
      throw new Error('User not found');
    }
    
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email.toLowerCase();
    if (req.body.avatar) updates.avatar = req.body.avatar;
    
    // If password is provided, update in Firebase Auth
    if (req.body.password) {
      await auth.updateUser(req.user._id, {
        password: req.body.password
      });
    }
    
    // Update Firebase Auth displayName if name is provided
    if (req.body.name) {
      await auth.updateUser(req.user._id, {
        displayName: req.body.name
      });
    }
    
    // Update Firestore document
    await userRef.update(updates);
    
    // Get updated user
    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data();
    
    // Generate new token
    const token = await auth.createCustomToken(req.user._id);
    
    res.json({
      _id: updatedUserDoc.id,
      name: updatedUserData.name,
      email: updatedUserData.email,
      isAdmin: updatedUserData.isAdmin || false,
      avatar: updatedUserData.avatar || '',
      token
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to update user profile');
  }
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    
    const users = [];
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        _id: doc.id,
        name: userData.name,
        email: userData.email,
        isAdmin: userData.isAdmin || false,
        avatar: userData.avatar || ''
      });
    });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500);
    throw new Error('Failed to get users');
  }
});