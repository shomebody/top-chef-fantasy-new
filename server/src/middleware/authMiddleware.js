// server/src/middleware/authMiddleware.js
import { auth, db } from '../config/firebase.js';
import asyncHandler from '../utils/asyncHandler.js';

// Protect routes - verify Firebase token
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token received:', token.substring(0, 20) + '...');
      
      // Verify token with Firebase Admin
      const decodedToken = await auth.verifyIdToken(token);
      console.log('Token verified for user:', decodedToken.uid);
      
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
  } else {
    console.log('No token found in request headers');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware
export const admin = asyncHandler(async (req, res, next) => {
  try {
    // Get user from Firestore
    const userDoc = await db.collection('users').doc(req.user._id).get();
    
    if (userDoc.exists && userDoc.data()?.isAdmin) {
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