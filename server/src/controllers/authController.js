// server/src/controllers/authController.js
import { auth, db } from '../config/firebase.js';
import { createLogger, format, transports } from 'winston';
import asyncHandler from '../utils/asyncHandler.js';

// Configure logging with Winston (consistent with index.js)
const logger = createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  try {
    const userSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).get();

    if (!userSnapshot.empty) {
      res.status(400);
      throw new Error('User already exists');
    }

    const userRecord = await auth.createUser({
      email: email.toLowerCase(),
      password,
      displayName: name,
    });

    const userId = userRecord.uid;
    await db.collection('users').doc(userId).set({
      name,
      email: email.toLowerCase(),
      avatar: '',
      isAdmin: false,
      leagues: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const token = await auth.createCustomToken(userId);

    res.status(201).json({
      _id: userId,
      name,
      email: email.toLowerCase(),
      isAdmin: false,
      token,
    });
  } catch (error) {
    logger.error('Registration error:', { message: error.message, stack: error.stack });
    res.status(400);
    throw new Error(error.message || 'Invalid user data');
  }
});

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  try {
    const userSnapshot = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();

    if (userSnapshot.empty) {
      res.status(401);
      throw new Error('Invalid email');
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    const token = await auth.createCustomToken(userId);

    res.json({
      _id: userId,
      name: userData.name ?? '',
      email: userData.email,
      isAdmin: userData.isAdmin ?? false,
      token,
    });
  } catch (error) {
    logger.error('Login error:', { message: error.message, stack: error.stack });
    res.status(401);
    throw new Error(error.message || 'Invalid email');
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

    const userData = userDoc.data() ?? {};

    res.json({
      _id: userDoc.id,
      name: userData.name ?? '',
      email: userData.email ?? '',
      isAdmin: userData.isAdmin ?? false,
      avatar: userData.avatar ?? '',
    });
  } catch (error) {
    logger.error('Get profile error:', { message: error.message, stack: error.stack });
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

    if (req.body.password) {
      if (req.body.password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
      }
      await auth.updateUser(req.user._id, { password: req.body.password });
    }

    if (req.body.name) {
      await auth.updateUser(req.user._id, { displayName: req.body.name });
    }

    await userRef.update(updates);

    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data() ?? {};

    const token = await auth.createCustomToken(req.user._id);

    res.json({
      _id: updatedUserDoc.id,
      name: updatedUserData.name ?? '',
      email: updatedUserData.email ?? '',
      isAdmin: updatedUserData.isAdmin ?? false,
      avatar: updatedUserData.avatar ?? '',
      token,
    });
  } catch (error) {
    logger.error('Update profile error:', { message: error.message, stack: error.stack });
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

    const users = usersSnapshot.docs.map((doc) => {
      const userData = doc.data() ?? {};
      return {
        _id: doc.id,
        name: userData.name ?? '',
        email: userData.email ?? '',
        isAdmin: userData.isAdmin ?? false,
        avatar: userData.avatar ?? '',
      };
    });

    res.json(users);
  } catch (error) {
    logger.error('Get users error:', { message: error.message, stack: error.stack });
    res.status(500);
    throw new Error('Failed to get users');
  }
});