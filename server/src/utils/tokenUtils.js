import jwt from 'jsonwebtoken';

// Generate JWT
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d' // Default to 30 days if not set
  });
};

// Verify JWT
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};