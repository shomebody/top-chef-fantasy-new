import { auth } from '../config/firebase.js';
import asyncHandler from '../utils/asyncHandler.js';

// Protect routes - verify Firebase token
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token with Firebase Admin
      const decodedToken = await auth.verifyIdToken(token);
      
      // Add user info to request
      req.user = {
        _id: decodedToken.uid,
        email: decodedToken.email || decodedToken.firebase.identities.email?.[0]
      };
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware
export const admin = asyncHandler(async (req, res, next) => {
  try {
    // Get user from Firestore
    const userDoc = await auth.getUser(req.user._id);
    const userData = (await db.collection('users').doc(req.user._id).get()).data();
    
    if (userData && userData.isAdmin) {
      next();
    } else {
      res.status(403);
      throw new Error('Not authorized as an admin');
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});