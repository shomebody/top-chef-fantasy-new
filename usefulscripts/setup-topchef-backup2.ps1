# Top Chef Fantasy Application Setup Script
# This script creates a full-stack Top Chef Fantasy application with
# - Frontend: Vite 6.2.2 + React 19.0.10
# - Backend: Express.js + MongoDB Atlas

# Error handling
$ErrorActionPreference = "Stop"

# Display a header and setup information
function Show-Header {
    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "    TOP CHEF FANTASY APPLICATION SETUP" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "- Frontend: Vite 6.2.2 + React 19.0.10" -ForegroundColor White
    Write-Host "- Backend: Express.js + MongoDB Atlas" -ForegroundColor White 
    Write-Host "- Socket.io for real-time communication" -ForegroundColor White
    Write-Host "============================================================`n" -ForegroundColor Cyan
}

# Create a directory if it doesn't exist
function New-Directory {
    param (
        [string]$path
    )
    
    if (-not (Test-Path $path)) {
        New-Item -Path $path -ItemType Directory | Out-Null
        Write-Host "Created directory: $path" -ForegroundColor Green
    }
}

# Create a file with content
function New-File {
    param (
        [string]$path,
        [string]$content
    )
    
    $directory = Split-Path -Path $path -Parent
    
    if (-not (Test-Path $directory)) {
        New-Directory -path $directory
    }
    
    Set-Content -Path $path -Value $content -Encoding UTF8
    Write-Host "Created file: $path" -ForegroundColor Green
}

function Main {
    # Show header information
    Show-Header
    
    # Define base directories
    $rootDir = Get-Location
    $backendDir = Join-Path -Path $rootDir -ChildPath "server"
    $frontendDir = Join-Path -Path $rootDir -ChildPath "client"
    
    Write-Host "Setting up project in: $rootDir" -ForegroundColor Yellow
    
    # Create base directories
    New-Directory -path $backendDir
    New-Directory -path $frontendDir

    # ==========================================
    # BACKEND SETUP
    # ==========================================
    Write-Host "`n[Setting up backend...]" -ForegroundColor Magenta
    
    # Create backend package.json
    $backendPackageJson = @"
{
  "name": "top-chef-fantasy-server",
  "version": "1.0.0",
  "description": "Backend server for Top Chef Fantasy application",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.2.3",
    "socket.io": "^4.7.5",
    "morgan": "^1.10.0",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "package.json") -content $backendPackageJson

    # Create backend .env file
    $backendEnv = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/topcheffantasy?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# CORS Configuration
CLIENT_URL=http://localhost:5173
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath ".env") -content $backendEnv

    # Create backend index.js file
    $backendIndex = @"
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import chefRoutes from './routes/chefRoutes.js';
import leagueRoutes from './routes/leagueRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';

// Socket imports
import setupSocket from './socket/index.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize express
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Setup Socket
setupSocket(io);

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chefs', chefRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/challenges', challengeRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Top Chef Fantasy API is running...');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/index.js") -content $backendIndex

    # Create MongoDB connection file
    $dbConfig = @"
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/config/db.js") -content $dbConfig

    # Create error middleware
    $errorMiddleware = @"
// Not found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/middleware/errorMiddleware.js") -content $errorMiddleware

    # Create auth middleware
    $authMiddleware = @"
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/userModel.js';

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }
  
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Admin middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/middleware/authMiddleware.js") -content $authMiddleware

    # Create async handler utility
    $asyncHandler = @"
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/utils/asyncHandler.js") -content $asyncHandler

    # Create socket setup
    $socketSetup = @"
import { verifyToken } from '../utils/tokenUtils.js';

// Socket event constants
export const EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_LEAGUE: 'join_league',
  LEAVE_LEAGUE: 'leave_league',
  SEND_MESSAGE: 'send_message',
  CHAT_MESSAGE: 'chat_message',
  CHEF_UPDATE: 'chef_update',
  LEAGUE_UPDATE: 'league_update',
  USER_TYPING: 'user_typing',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  SCORE_UPDATE: 'score_update'
};

// Setup Socket.io connections and event handlers
const setupSocket = (io) => {
  // Authenticate Socket.io connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      const user = verifyToken(token);
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connections
  io.on(EVENTS.CONNECTION, (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Join user's leagues
    socket.on(EVENTS.JOIN_LEAGUE, ({ leagueId }) => {
      socket.join(`league:${leagueId}`);
      console.log(`User ${socket.user.id} joined league: ${leagueId}`);
      
      // Notify other users
      socket.to(`league:${leagueId}`).emit(EVENTS.USER_JOINED, {
        userId: socket.user.id,
        username: socket.user.name,
        timestamp: new Date()
      });
    });
    
    // Leave a league
    socket.on(EVENTS.LEAVE_LEAGUE, ({ leagueId }) => {
      socket.leave(`league:${leagueId}`);
      console.log(`User ${socket.user.id} left league: ${leagueId}`);
      
      // Notify other users
      socket.to(`league:${leagueId}`).emit(EVENTS.USER_LEFT, {
        userId: socket.user.id,
        username: socket.user.name,
        timestamp: new Date()
      });
    });
    
    // Handle chat messages
    socket.on(EVENTS.SEND_MESSAGE, (message) => {
      const enhancedMessage = {
        ...message,
        userId: socket.user.id,
        username: socket.user.name,
        timestamp: new Date()
      };
      
      // Broadcast to the specific league
      io.to(`league:${message.leagueId}`).emit(EVENTS.CHAT_MESSAGE, enhancedMessage);
      
      // Save message to database (could be implemented here or in a separate service)
    });
    
    // Handle user typing
    socket.on(EVENTS.USER_TYPING, ({ leagueId }) => {
      socket.to(`league:${leagueId}`).emit(EVENTS.USER_TYPING, {
        userId: socket.user.id,
        username: socket.user.name
      });
    });
    
    // Handle disconnection
    socket.on(EVENTS.DISCONNECT, () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
};

export default setupSocket;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/socket/index.js") -content $socketSetup

    # Create token utilities
    $tokenUtils = @"
import jwt from 'jsonwebtoken';

// Generate JWT
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Verify JWT
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/utils/tokenUtils.js") -content $tokenUtils

    # Create user model
    $userModel = @"
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  leagues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/models/userModel.js") -content $userModel

    # Create chef model
    $chefModel = @"
import mongoose from 'mongoose';

const chefSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a chef name'],
    trim: true
  },
  bio: {
    type: String,
    required: [true, 'Please provide a chef bio']
  },
  hometown: {
    type: String,
    required: [true, 'Please provide a hometown']
  },
  specialty: {
    type: String,
    required: [true, 'Please provide a specialty']
  },
  image: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'eliminated', 'winner'],
    default: 'active'
  },
  eliminationWeek: {
    type: Number,
    default: null
  },
  stats: {
    wins: {
      type: Number,
      default: 0
    },
    eliminations: {
      type: Number,
      default: 0
    },
    quickfireWins: {
      type: Number,
      default: 0
    },
    challengeWins: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    }
  },
  weeklyPerformance: [{
    week: Number,
    points: Number,
    rank: Number,
    highlights: String
  }]
}, {
  timestamps: true
});

const Chef = mongoose.model('Chef', chefSchema);

export default Chef;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/models/chefModel.js") -content $chefModel

    # Create league model
    $leagueModel = @"
import mongoose from 'mongoose';

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a league name'],
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    roster: [{
      chef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chef'
      },
      drafted: {
        type: Date,
        default: Date.now
      },
      active: {
        type: Boolean,
        default: true
      }
    }],
    score: {
      type: Number,
      default: 0
    }
  }],
  season: {
    type: Number,
    required: [true, 'Please provide a season number']
  },
  maxMembers: {
    type: Number,
    default: 10
  },
  maxRosterSize: {
    type: Number,
    default: 5
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft'
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true
  },
  scoringSettings: {
    quickfireWin: { type: Number, default: 10 },
    challengeWin: { type: Number, default: 20 },
    topThree: { type: Number, default: 5 },
    bottomThree: { type: Number, default: -5 },
    elimination: { type: Number, default: -15 },
    finalWinner: { type: Number, default: 50 }
  },
  draftOrder: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    position: Number
  }],
  currentWeek: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

const League = mongoose.model('League', leagueSchema);

export default League;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/models/leagueModel.js") -content $leagueModel

    # Create challenge model
    $challengeModel = @"
import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  season: {
    type: Number,
    required: [true, 'Please provide a season number']
  },
  week: {
    type: Number,
    required: [true, 'Please provide a week number']
  },
  title: {
    type: String,
    required: [true, 'Please provide a challenge title']
  },
  description: {
    type: String,
    required: [true, 'Please provide a challenge description']
  },
  location: {
    type: String,
    required: [true, 'Please provide a location']
  },
  isQuickfire: {
    type: Boolean,
    default: false
  },
  guest: {
    type: String,
    default: ''
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chef',
    default: null
  },
  topChefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chef'
  }],
  bottomChefs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chef'
  }],
  eliminatedChef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chef',
    default: null
  },
  airDate: {
    type: Date,
    required: [true, 'Please provide an air date']
  },
  status: {
    type: String,
    enum: ['upcoming', 'completed'],
    default: 'upcoming'
  }
}, {
  timestamps: true
});

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/models/challengeModel.js") -content $challengeModel

    # Create message model
    $messageModel = @"
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please provide message content']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'system'],
    default: 'text'
  },
  reactions: {
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    hearts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/models/messageModel.js") -content $messageModel

    # Create auth controller
    $authController = @"
import User from '../models/userModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateToken } from '../utils/tokenUtils.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if user already exists
  const userExists = await User.findOne({ email });
  
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  
  // Create new user
  const user = await User.create({
    name,
    email,
    password
  });
  
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = await User.findOne({ email }).select('+password');
  
  // Check if user exists and password is correct
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;
    
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      token: generateToken(updatedUser._id)
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/controllers/authController.js") -content $authController

    # Create league controller
    $leagueController = @"
import League from '../models/leagueModel.js';
import User from '../models/userModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import crypto from 'crypto';

// @desc    Create a new league
// @route   POST /api/leagues
// @access  Private
export const createLeague = asyncHandler(async (req, res) => {
  const { name, season, maxMembers, maxRosterSize, scoringSettings } = req.body;
  
  // Generate a unique invite code
  const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  
  const league = await League.create({
    name,
    creator: req.user._id,
    season,
    maxMembers: maxMembers || 10,
    maxRosterSize: maxRosterSize || 5,
    inviteCode,
    scoringSettings: scoringSettings || {},
    members: [{ 
      user: req.user._id, 
      role: 'owner'
    }]
  });
  
  // Add league to user's leagues
  await User.findByIdAndUpdate(req.user._id, {
    '`$push: { leagues: league._id }'
  });
  
  res.status(201).json(league);
});

// @desc    Get all leagues for the current user
// @route   GET /api/leagues
// @access  Private
export const getUserLeagues = asyncHandler(async (req, res) => {
  const leagues = await League.find({ 'members.user': req.user._id })
    .populate('creator', 'name email')
    .populate('members.user', 'name email');
  
  res.json(leagues);
});

// @desc    Get a league by ID
// @route   GET /api/leagues/:id
// @access  Private
export const getLeagueById = asyncHandler(async (req, res) => {
  const league = await League.findById(req.params.id)
    .populate('creator', 'name email')
    .populate('members.user', 'name email')
    .populate('members.roster.chef');
  
  if (league) {
    // Check if user is a member of the league
    const isMember = league.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );
    
    if (isMember) {
      res.json(league);
    } else {
      res.status(403);
      throw new Error('Not authorized to access this league');
    }
  } else {
    res.status(404);
    throw new Error('League not found');
  }
});

// @desc    Update a league
// @route   PUT /api/leagues/:id
// @access  Private
export const updateLeague = asyncHandler(async (req, res) => {
  const league = await League.findById(req.params.id);
  
  if (league) {
    // Check if user is the owner or admin
    const member = league.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (member && (member.role === 'owner' || member.role === 'admin')) {
      league.name = req.body.name || league.name;
      league.maxMembers = req.body.maxMembers || league.maxMembers;
      league.maxRosterSize = req.body.maxRosterSize || league.maxRosterSize;
      league.scoringSettings = req.body.scoringSettings || league.scoringSettings;
      league.status = req.body.status || league.status;
      league.currentWeek = req.body.currentWeek || league.currentWeek;
      
      const updatedLeague = await league.save();
      res.json(updatedLeague);
    } else {
      res.status(403);
      throw new Error('Not authorized to update this league');
    }
  } else {
    res.status(404);
    throw new Error('League not found');
  }
});

// @desc    Join a league with invite code
// @route   POST /api/leagues/join
// @access  Private
export const joinLeague = asyncHandler(async (req, res) => {
  const { inviteCode } = req.body;
  
  const league = await League.findOne({ inviteCode });
  
  if (league) {
    // Check if league is full
    if (league.members.length >= league.maxMembers) {
      res.status(400);
      throw new Error('League is full');
    }
    
    // Check if user is already a member
    const isMember = league.members.some(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (isMember) {
      res.status(400);
      throw new Error('You are already a member of this league');
    }
    
    // Add user to league members
    league.members.push({
      user: req.user._id,
      role: 'member'
    });
    
    await league.save();
    
    // Add league to user's leagues
    await User.findByIdAndUpdate(req.user._id, {
      `$push: { leagues: league._id }
    });
    
    res.json(league);
  } else {
    res.status(404);
    throw new Error('League not found with that invite code');
  }
});

// @desc    Update draft order
// @route   PUT /api/leagues/:id/draft-order
// @access  Private
export const updateDraftOrder = asyncHandler(async (req, res) => {
  const { draftOrder } = req.body;
  const league = await League.findById(req.params.id);
  
  if (league) {
    // Check if user is the owner or admin
    const member = league.members.find(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (member && (member.role === 'owner' || member.role === 'admin')) {
      league.draftOrder = draftOrder;
      const updatedLeague = await league.save();
      res.json(updatedLeague);
    } else {
      res.status(403);
      throw new Error('Not authorized to update draft order');
    }
  } else {
    res.status(404);
    throw new Error('League not found');
  }
});

// @desc    Draft a chef to user's roster
// @route   POST /api/leagues/:id/draft
// @access  Private
export const draftChef = asyncHandler(async (req, res) => {
  const { chefId } = req.body;
  const league = await League.findById(req.params.id);
  
  if (league) {
    // Check if league is in draft status
    if (league.status !== 'draft') {
      res.status(400);
      throw new Error('League is not in draft mode');
    }
    
    // Find the user's member object
    const memberIndex = league.members.findIndex(member => 
      member.user.toString() === req.user._id.toString()
    );
    
    if (memberIndex === -1) {
      res.status(403);
      throw new Error('You are not a member of this league');
    }
    
    // Check if roster is full
    if (league.members[memberIndex].roster.length >= league.maxRosterSize) {
      res.status(400);
      throw new Error('Your roster is full');
    }
    
    // Check if chef is already drafted by anyone in the league
    const chefDrafted = league.members.some(member => 
      member.roster.some(r => r.chef.toString() === chefId)
    );
    
    if (chefDrafted) {
      res.status(400);
      throw new Error('This chef has already been drafted');
    }
    
    // Add chef to user's roster
    league.members[memberIndex].roster.push({
      chef: chefId,
      drafted: new Date(),
      active: true
    });
    
    const updatedLeague = await league.save();
    res.json(updatedLeague);
  } else {
    res.status(404);
    throw new Error('League not found');
  }
});

// @desc    Get league leaderboard
// @route   GET /api/leagues/:id/leaderboard
// @access  Private
export const getLeagueLeaderboard = asyncHandler(async (req, res) => {
  const league = await League.findById(req.params.id)
    .populate('members.user', 'name email avatar')
    .populate('members.roster.chef');
  
  if (league) {
    // Check if user is a member of the league
    const isMember = league.members.some(member => 
      member.user._id.toString() === req.user._id.toString()
    );
    
    if (isMember) {
      // Sort members by score
      const leaderboard = league.members
        .map(member => ({
          user: {
            _id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            avatar: member.user.avatar
          },
          score: member.score,
          rosterCount: member.roster.length
        }))
        .sort((a, b) => b.score - a.score);
      
      res.json(leaderboard);
    } else {
      res.status(403);
      throw new Error('Not authorized to access this league');
    }
  } else {
    res.status(404);
    throw new Error('League not found');
  }
});
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/controllers/leagueController.js") -content $leagueController

    # Create chef controller
    $chefController = @"
import Chef from '../models/chefModel.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all chefs
// @route   GET /api/chefs
// @access  Private
export const getChefs = asyncHandler(async (req, res) => {
  const chefs = await Chef.find({}).sort({ 'stats.totalPoints': -1 });
  res.json(chefs);
});

// @desc    Get a chef by ID
// @route   GET /api/chefs/:id
// @access  Private
export const getChefById = asyncHandler(async (req, res) => {
  const chef = await Chef.findById(req.params.id);
  
  if (chef) {
    res.json(chef);
  } else {
    res.status(404);
    throw new Error('Chef not found');
  }
});

// @desc    Create a chef (admin only)
// @route   POST /api/chefs
// @access  Private/Admin
export const createChef = asyncHandler(async (req, res) => {
  const { name, bio, hometown, specialty, image } = req.body;
  
  const chef = await Chef.create({
    name,
    bio,
    hometown,
    specialty,
    image: image || ''
  });
  
  res.status(201).json(chef);
});

// @desc    Update a chef (admin only)
// @route   PUT /api/chefs/:id
// @access  Private/Admin
export const updateChef = asyncHandler(async (req, res) => {
  const chef = await Chef.findById(req.params.id);
  
  if (chef) {
    chef.name = req.body.name || chef.name;
    chef.bio = req.body.bio || chef.bio;
    chef.hometown = req.body.hometown || chef.hometown;
    chef.specialty = req.body.specialty || chef.specialty;
    chef.image = req.body.image || chef.image;
    chef.status = req.body.status || chef.status;
    
    if (req.body.stats) {
      chef.stats = {
        ...chef.stats,
        ...req.body.stats
      };
    }
    
    if (req.body.eliminationWeek !== undefined) {
      chef.eliminationWeek = req.body.eliminationWeek;
    }
    
    if (req.body.weeklyPerformance) {
      chef.weeklyPerformance.push(req.body.weeklyPerformance);
    }
    
    const updatedChef = await chef.save();
    res.json(updatedChef);
  } else {
    res.status(404);
    throw new Error('Chef not found');
  }
});

// @desc    Get chef stats
// @route   GET /api/chefs/:id/stats
// @access  Private
export const getChefStats = asyncHandler(async (req, res) => {
  const chef = await Chef.findById(req.params.id);
  
  if (chef) {
    res.json({
      stats: chef.stats,
      weeklyPerformance: chef.weeklyPerformance,
      status: chef.status,
      eliminationWeek: chef.eliminationWeek
    });
  } else {
    res.status(404);
    throw new Error('Chef not found');
  }
});

// @desc    Update weekly performance for all chefs (admin only)
// @route   POST /api/chefs/weekly-update
// @access  Private/Admin
export const updateWeeklyPerformance = asyncHandler(async (req, res) => {
  const { week, performances } = req.body;
  
  // performances is an array of { chefId, points, rank, highlights }
  
  const results = [];
  
  for (const performance of performances) {
    const chef = await Chef.findById(performance.chefId);
    
    if (chef) {
      // Add weekly performance
      chef.weeklyPerformance.push({
        week,
        points: performance.points,
        rank: performance.rank,
        highlights: performance.highlights
      });
      
      // Update total points
      chef.stats.totalPoints += performance.points;
      
      // Update other stats based on highlights
      if (performance.highlights.includes('quickfire win')) {
        chef.stats.quickfireWins += 1;
      }
      
      if (performance.highlights.includes('challenge win')) {
        chef.stats.challengeWins += 1;
        chef.stats.wins += 1;
      }
      
      if (performance.highlights.includes('eliminated')) {
        chef.status = 'eliminated';
        chef.eliminationWeek = week;
        chef.stats.eliminations += 1;
      }
      
      await chef.save();
      results.push(chef);
    }
  }
  
  res.json(results);
});
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/controllers/chefController.js") -content $chefController

    # Create challenge controller
    $challengeController = @"
import Challenge from '../models/challengeModel.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all challenges
// @route   GET /api/challenges
// @access  Private
export const getChallenges = asyncHandler(async (req, res) => {
  const { season } = req.query;
  
  const filter = season ? { season } : {};
  
  const challenges = await Challenge.find(filter)
    .populate('winner', 'name image')
    .populate('topChefs', 'name image')
    .populate('bottomChefs', 'name image')
    .populate('eliminatedChef', 'name image')
    .sort({ season: 1, week: 1 });
  
  res.json(challenges);
});

// @desc    Get a challenge by ID
// @route   GET /api/challenges/:id
// @access  Private
export const getChallengeById = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id)
    .populate('winner', 'name image')
    .populate('topChefs', 'name image')
    .populate('bottomChefs', 'name image')
    .populate('eliminatedChef', 'name image');
  
  if (challenge) {
    res.json(challenge);
  } else {
    res.status(404);
    throw new Error('Challenge not found');
  }
});

// @desc    Create a challenge (admin only)
// @route   POST /api/challenges
// @access  Private/Admin
export const createChallenge = asyncHandler(async (req, res) => {
  const {
    season,
    week,
    title,
    description,
    location,
    isQuickfire,
    guest,
    airDate
  } = req.body;
  
  const challenge = await Challenge.create({
    season,
    week,
    title,
    description,
    location,
    isQuickfire: isQuickfire || false,
    guest: guest || '',
    airDate
  });
  
  res.status(201).json(challenge);
});

// @desc    Update a challenge (admin only)
// @route   PUT /api/challenges/:id
// @access  Private/Admin
export const updateChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);
  
  if (challenge) {
    challenge.title = req.body.title || challenge.title;
    challenge.description = req.body.description || challenge.description;
    challenge.location = req.body.location || challenge.location;
    challenge.isQuickfire = req.body.isQuickfire !== undefined ? req.body.isQuickfire : challenge.isQuickfire;
    challenge.guest = req.body.guest || challenge.guest;
    challenge.airDate = req.body.airDate || challenge.airDate;
    challenge.status = req.body.status || challenge.status;
    
    if (req.body.winner !== undefined) {
      challenge.winner = req.body.winner;
    }
    
    if (req.body.topChefs) {
      challenge.topChefs = req.body.topChefs;
    }
    
    if (req.body.bottomChefs) {
      challenge.bottomChefs = req.body.bottomChefs;
    }
    
    if (req.body.eliminatedChef !== undefined) {
      challenge.eliminatedChef = req.body.eliminatedChef;
    }
    
    const updatedChallenge = await challenge.save();
    res.json(updatedChallenge);
  } else {
    res.status(404);
    throw new Error('Challenge not found');
  }
});

// @desc    Get current week's challenges
// @route   GET /api/challenges/current
// @access  Private
export const getCurrentChallenges = asyncHandler(async (req, res) => {
  const { season } = req.query;
  
  if (!season) {
    res.status(400);
    throw new Error('Season parameter is required');
  }
  
  // Find the most recent challenge by airDate
  const latestChallenge = await Challenge.findOne({ season })
    .sort({ airDate: -1 });
  
  if (!latestChallenge) {
    res.status(404);
    throw new Error('No challenges found for this season');
  }
  
  // Get all challenges from the same week
  const currentChallenges = await Challenge.find({
    season,
    week: latestChallenge.week
  })
    .populate('winner', 'name image')
    .populate('topChefs', 'name image')
    .populate('bottomChefs', 'name image')
    .populate('eliminatedChef', 'name image')
    .sort({ isQuickfire: 1, airDate: 1 });
  
  res.json(currentChallenges);
});
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/controllers/challengeController.js") -content $challengeController

    # Create message controller
    $messageController = @"
import Message from '../models/messageModel.js';
import League from '../models/leagueModel.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get messages for a league
// @route   GET /api/messages/:leagueId
// @access  Private
export const getLeagueMessages = asyncHandler(async (req, res) => {
  const { leagueId } = req.params;
  const { limit = 50, before } = req.query;
  
  // Check if user is a member of the league
  const league = await League.findById(leagueId);
  
  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }
  
  const isMember = league.members.some(member => 
    member.user.toString() === req.user._id.toString()
  );
  
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to access this league');
  }
  
  // Build query
  let query = { league: leagueId };
  
  if (before) {
    query.createdAt = { `$lt: new Date(before) };
  }
  
  // Get messages
  const messages = await Message.find(query)
    .populate('sender', 'name email avatar')
    .sort('-createdAt')
    .limit(parseInt(limit));
  
  // Mark messages as read
  await Message.updateMany(
    {
      league: leagueId,
      readBy: { `$ne: req.user._id }
    },
    {
      `$addToSet: { readBy: req.user._id }
    }
  );
  
  res.json(messages);
});

// @desc    Create a message
// @route   POST /api/messages
// @access  Private
export const createMessage = asyncHandler(async (req, res) => {
  const { leagueId, content, type = 'text' } = req.body;
  
  // Check if user is a member of the league
  const league = await League.findById(leagueId);
  
  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }
  
  const isMember = league.members.some(member => 
    member.user.toString() === req.user._id.toString()
  );
  
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to post in this league');
  }
  
  // Create message
  const message = await Message.create({
    league: leagueId,
    sender: req.user._id,
    content,
    type,
    readBy: [req.user._id]  // Sender has read the message by default
  });
  
  // Populate sender information
  await message.populate('sender', 'name email avatar');
  
  res.status(201).json(message);
});

// @desc    Add reaction to a message
// @route   POST /api/messages/:id/reaction
// @access  Private
export const addReaction = asyncHandler(async (req, res) => {
  const { reaction } = req.body;
  
  if (!['likes', 'hearts'].includes(reaction)) {
    res.status(400);
    throw new Error('Invalid reaction type');
  }
  
  const message = await Message.findById(req.params.id);
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  
  // Check if user has already reacted
  const hasReacted = message.reactions[reaction].some(userId => 
    userId.toString() === req.user._id.toString()
  );
  
  if (hasReacted) {
    // Remove reaction
    message.reactions[reaction] = message.reactions[reaction].filter(userId => 
      userId.toString() !== req.user._id.toString()
    );
  } else {
    // Add reaction
    message.reactions[reaction].push(req.user._id);
  }
  
  await message.save();
  
  res.json({ message: 'Reaction updated', reactions: message.reactions });
});

// @desc    Get unread message count
// @route   GET /api/messages/unread/:leagueId
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { leagueId } = req.params;
  
  // Check if user is a member of the league
  const league = await League.findById(leagueId);
  
  if (!league) {
    res.status(404);
    throw new Error('League not found');
  }
  
  const isMember = league.members.some(member => 
    member.user.toString() === req.user._id.toString()
  );
  
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to access this league');
  }
  
  // Count unread messages
  const unreadCount = await Message.countDocuments({
    league: leagueId,
    sender: { `$ne: req.user._id },
    readBy: { `$ne: req.user._id }
  });
  
  res.json({ unreadCount });
});
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/controllers/messageController.js") -content $messageController

    # Create auth routes
    $authRoutes = @"
import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers
} from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Admin routes
router.get('/users', protect, admin, getUsers);

export default router;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/routes/authRoutes.js") -content $authRoutes

    # Create league routes
    $leagueRoutes = @"
import express from 'express';
import {
  createLeague,
  getUserLeagues,
  getLeagueById,
  updateLeague,
  joinLeague,
  updateDraftOrder,
  draftChef,
  getLeagueLeaderboard
} from '../controllers/leagueController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getUserLeagues)
  .post(createLeague);

router.post('/join', joinLeague);

router.route('/:id')
  .get(getLeagueById)
  .put(updateLeague);

router.put('/:id/draft-order', updateDraftOrder);
router.post('/:id/draft', draftChef);
router.get('/:id/leaderboard', getLeagueLeaderboard);

export default router;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/routes/leagueRoutes.js") -content $leagueRoutes

    # Create chef routes
    $chefRoutes = @"
import express from 'express';
import {
  getChefs,
  getChefById,
  createChef,
  updateChef,
  getChefStats,
  updateWeeklyPerformance
} from '../controllers/chefController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getChefs)
  .post(admin, createChef);

router.route('/:id')
  .get(getChefById)
  .put(admin, updateChef);

router.get('/:id/stats', getChefStats);
router.post('/weekly-update', admin, updateWeeklyPerformance);

export default router;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/routes/chefRoutes.js") -content $chefRoutes

    # Create challenge routes
    $challengeRoutes = @"
import express from 'express';
import {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  getCurrentChallenges
} from '../controllers/challengeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
  .get(getChallenges)
  .post(admin, createChallenge);

router.get('/current', getCurrentChallenges);

router.route('/:id')
  .get(getChallengeById)
  .put(admin, updateChallenge);

export default router;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/routes/challengeRoutes.js") -content $challengeRoutes

    # Create message routes
    $messageRoutes = @"
import express from 'express';
import {
  getLeagueMessages,
  createMessage,
  addReaction,
  getUnreadCount
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', createMessage);
router.get('/:leagueId', getLeagueMessages);
router.post('/:id/reaction', addReaction);
router.get('/unread/:leagueId', getUnreadCount);

export default router;
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath "src/routes/messageRoutes.js") -content $messageRoutes

    # Create render.yaml for deployment
    $renderYaml = @"
services:
  # Backend service
  - type: web
    name: top-chef-fantasy-api
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CLIENT_URL
        value: https://top-chef-fantasy.onrender.com

  # Frontend service
  - type: web
    name: top-chef-fantasy
    env: static
    buildCommand: cd client && npm install && npm run build
    staticPublishPath: ./client/dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        value: https://top-chef-fantasy-api.onrender.com/api
      - key: VITE_SOCKET_URL
        value: https://top-chef-fantasy-api.onrender.com
"@
    New-File -path (Join-Path -Path $rootDir -ChildPath "render.yaml") -content $renderYaml


    # ==========================================
    # FRONTEND SETUP
    # ==========================================
    Write-Host "`n[Setting up frontend...]" -ForegroundColor Magenta
    
    # Create frontend package.json
    $frontendPackageJson = @"
{
  "name": "top-chef-fantasy",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "@heroicons/react": "^2.1.4",
    "axios": "^1.6.7",
    "react": "^19.0.10",
    "react-dom": "^19.0.10",
    "react-router-dom": "^6.22.2",
    "socket.io-client": "^4.7.5",
    "chart.js": "^4.4.2",
    "react-chartjs-2": "^5.2.0",
    "date-fns": "^3.3.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.5",
    "@types/react-dom": "^19.0.5",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^6.2.2"
  }
}
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "package.json") -content $frontendPackageJson

    # Create vite.config.js
    $viteConfig = @"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
  define: {
    // Fix process.env usage for React 19
    'process.env': {},
  },
  esbuild: {
    // Custom targets for compatibility
    target: 'es2020'
  },
  build: {
    target: 'es2020',
    cssTarget: 'chrome80',
    outDir: 'dist',
    // Better optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@heroicons/react', 'chart.js', 'react-chartjs-2'],
        },
      },
    },
  },
});
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "vite.config.js") -content $viteConfig

    # Create tailwind.config.js
    $tailwindConfig = @"
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Bebas Neue', 'cursive'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        pulse: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "tailwind.config.js") -content $tailwindConfig

    # Create postcss.config.js
    $postcssConfig = @"
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "postcss.config.js") -content $postcssConfig

    # Create index.html
    $indexHtml = @"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Top Chef Fantasy League</title>
    <meta name="description" content="Fantasy league app for Top Chef fans" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Bebas+Neue&display=swap" rel="stylesheet">
  </head>
  <body class="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "index.html") -content $indexHtml

    # Create .env file
    $envFile = @"
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath ".env") -content $envFile

    # Create main entry point
    $mainJsx = @"
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { BrowserRouter } from 'react-router-dom';

// React 19 createRoot 
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/main.jsx") -content $mainJsx

    # Create index.css
    `$indexCss = @"
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom utility classes */
@layer components {
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none;
  }
  
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white shadow-sm;
  }
  
  .btn-secondary {
    @apply bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200;
  }
  
  .btn-outline {
    @apply border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300;
  }
  
  .card {
    @apply bg-white dark:bg-gray-800 rounded-xl shadow-card transition-all duration-200;
  }
  
  .card-hover {
    @apply hover:shadow-card-hover hover:-translate-y-1;
  }
  
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white;
  }
  
  .label {
    @apply block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300;
  }
}
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/index.css") -content `$indexCss

    # Create App.jsx
    $appJsx = @"
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import { useTheme } from './hooks/useTheme.jsx';

// Layouts
import MainLayout from './layouts/MainLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import ChefRoster from './pages/ChefRoster.jsx';
import Leagues from './pages/Leagues.jsx';
import LeagueDetail from './pages/LeagueDetail.jsx';
import Schedule from './pages/Schedule.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import LoadingScreen from './components/ui/LoadingScreen.jsx';

const App = () => {
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();
  const [appReady, setAppReady] = useState(false);
  
  // Simulate app initialization
  useEffect(() => {
    if (!loading) {
      // Add a slight delay for smoother transition
      const timer = setTimeout(() => {
        setAppReady(true);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);
  
  if (loading || !appReady) {
    return <LoadingScreen />;
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/" /> : <Register />} 
          />
        </Route>
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chefs" element={<ChefRoster />} />
            <Route path="/leagues" element={<Leagues />} />
            <Route path="/leagues/:id" element={<LeagueDetail />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/App.jsx") -content $appJsx

    # Create AuthContext.jsx
    $authContext = @"
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in (from localStorage token)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Set auth header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Get user profile
          const response = await api.get('/auth/profile');
          setUser(response.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
        setError('Session expired. Please log in again.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data;
      
      // Set token in localStorage
      localStorage.setItem('token', token);
      
      // Set auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/register', userData);
      const { token, ...newUser } = response.data;
      
      // Set token in localStorage
      localStorage.setItem('token', token);
      
      // Set auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(newUser);
      setIsAuthenticated(true);
      
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put('/auth/profile', userData);
      setUser({...user, ...response.data});
      
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const contextValue = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    updateProfile,
    setError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/context/AuthContext.jsx") -content $authContext

    # Create ThemeContext.jsx
    $themeContext = @"
import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Check if dark mode is preferred or stored in localStorage
  const getInitialTheme = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (typeof storedTheme === 'string') {
        return storedTheme;
      }

      const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
      if (userMedia.matches) {
        return 'dark';
      }
    }

    return 'light'; // Default theme
  };

  const [theme, setTheme] = useState(getInitialTheme);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const contextValue = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/context/ThemeContext.jsx") -content $themeContext

    # Create SocketContext.jsx
    $socketContext = @"
import React, { createContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth.jsx';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      
      // Create socket connection
      socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true
      });
      
      // Socket events
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });
      
      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setConnected(false);
      });
      
      setSocket(socketInstance);
    }
    
    // Cleanup function
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  // Socket event constants
  const EVENTS = {
    JOIN_LEAGUE: 'join_league',
    LEAVE_LEAGUE: 'leave_league',
    SEND_MESSAGE: 'send_message',
    CHAT_MESSAGE: 'chat_message',
    CHEF_UPDATE: 'chef_update',
    LEAGUE_UPDATE: 'league_update',
    USER_TYPING: 'user_typing',
    USER_JOINED: 'user_joined',
    USER_LEFT: 'user_left',
    SCORE_UPDATE: 'score_update'
  };

  // Join a league channel
  const joinLeague = (leagueId) => {
    if (socket && connected) {
      socket.emit(EVENTS.JOIN_LEAGUE, { leagueId });
    }
  };

  // Leave a league channel
  const leaveLeague = (leagueId) => {
    if (socket && connected) {
      socket.emit(EVENTS.LEAVE_LEAGUE, { leagueId });
    }
  };

  // Send a message to a league
  const sendMessage = (message) => {
    if (socket && connected) {
      socket.emit(EVENTS.SEND_MESSAGE, message);
    }
  };

  // Indicate typing in a channel
  const sendTyping = (leagueId) => {
    if (socket && connected) {
      socket.emit(EVENTS.USER_TYPING, { leagueId });
    }
  };

  const contextValue = {
    socket,
    connected,
    EVENTS,
    joinLeague,
    leaveLeague,
    sendMessage,
    sendTyping
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/context/SocketContext.jsx") -content $socketContext

    # Create LeagueContext.jsx
    $leagueContext = @"
import React, { createContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useSocket } from '../hooks/useSocket.jsx';
import api from '../services/api.js';

export const LeagueContext = createContext();

export const LeagueProvider = ({ children }) => {
  const [leagues, setLeagues] = useState([]);
  const [currentLeague, setCurrentLeague] = useState(null);
  const [chefs, setChefs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, isAuthenticated } = useAuth();
  const { socket, connected, EVENTS, joinLeague } = useSocket();
  
  // Load user's leagues
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserLeagues();
    }
  }, [isAuthenticated]);
  
  // Listen for league updates from socket
  useEffect(() => {
    if (socket && connected && currentLeague) {
      // Join the league channel
      joinLeague(currentLeague._id);
      
      // Listen for league updates
      socket.on(EVENTS.LEAGUE_UPDATE, handleLeagueUpdate);
      socket.on(EVENTS.SCORE_UPDATE, handleScoreUpdate);
      
      return () => {
        socket.off(EVENTS.LEAGUE_UPDATE, handleLeagueUpdate);
        socket.off(EVENTS.SCORE_UPDATE, handleScoreUpdate);
      };
    }
  }, [socket, connected, currentLeague]);
  
  // Fetch leagues data
  const fetchUserLeagues = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leagues');
      setLeagues(response.data);
      
      // Set current league to first one if none selected
      if (response.data.length > 0 && !currentLeague) {
        setCurrentLeague(response.data[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching leagues:', err);
      setError('Failed to load your leagues');
    } finally {
      setLoading(false);
    }
  };
  
  // Get league details including chefs, leaderboard, etc.
  const fetchLeagueDetails = async (leagueId) => {
    try {
      setLoading(true);
      
      // Fetch league details
      const leagueResponse = await api.get(`/leagues/${leagueId}`);
      setCurrentLeague(leagueResponse.data);
      
      // Fetch chefs
      const chefsResponse = await api.get('/chefs');
      setChefs(chefsResponse.data);
      
      // Fetch leaderboard
      const leaderboardResponse = await api.get(`/leagues/${leagueId}/leaderboard`);
      setLeaderboard(leaderboardResponse.data);
      
      // Fetch challenges
      const challengesResponse = await api.get('/challenges', {
        params: { season: leagueResponse.data.season }
      });
      setChallenges(challengesResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching league details:', err);
      setError('Failed to load league details');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle league updates from socket
  const handleLeagueUpdate = (data) => {
    if (data.leagueId === currentLeague?._id) {
      // Update current league
      setCurrentLeague(prev => ({...prev, ...data.updates}));
      
      // If the update includes new member data, refresh leaderboard
      if (data.updates.members) {
        fetchLeagueDetails(currentLeague._id);
      }
    }
  };
  
  // Handle score updates from socket
  const handleScoreUpdate = (data) => {
    if (data.leagueId === currentLeague?._id) {
      // Update leaderboard
      setLeaderboard(prevLeaderboard => 
        prevLeaderboard.map(item => 
          item.user._id === data.userId 
            ? {...item, score: data.newScore} 
            : item
        ).sort((a, b) => b.score - a.score)
      );
    }
  };
  
  // Create a new league
  const createLeague = async (leagueData) => {
    try {
      setLoading(true);
      const response = await api.post('/leagues', leagueData);
      
      // Update leagues list and set current league
      setLeagues([...leagues, response.data]);
      setCurrentLeague(response.data);
      
      return response.data;
    } catch (err) {
      console.error('Error creating league:', err);
      setError('Failed to create league');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Join a league with invite code
  const joinLeagueWithCode = async (inviteCode) => {
    try {
      setLoading(true);
      const response = await api.post('/leagues/join', { inviteCode });
      
      // Update leagues list and set current league
      setLeagues([...leagues, response.data]);
      setCurrentLeague(response.data);
      
      return response.data;
    } catch (err) {
      console.error('Error joining league:', err);
      setError('Failed to join league');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Switch current league
  const switchLeague = (leagueId) => {
    const league = leagues.find(l => l._id === leagueId);
    if (league) {
      setCurrentLeague(league);
      fetchLeagueDetails(leagueId);
    }
  };
  
  const contextValue = {
    leagues,
    currentLeague,
    chefs,
    leaderboard,
    challenges,
    loading,
    error,
    fetchUserLeagues,
    fetchLeagueDetails, 
    createLeague,
    joinLeagueWithCode,
    switchLeague
  };

  return (
    <LeagueContext.Provider value={contextValue}>
      {children}
    </LeagueContext.Provider>
  );
};
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/context/LeagueContext.jsx") -content $leagueContext

    # Create hooks
    $useAuth = @"
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/hooks/useAuth.jsx") -content $useAuth

    $useTheme = @"
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/hooks/useTheme.jsx") -content $useTheme

    $useSocket = @"
import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext.jsx';

export const useSocket = () => {
  const context = useContext(SocketContext);
  
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  
  return context;
};
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/hooks/useSocket.jsx") -content $useSocket

    $useLeague = @"
import { useContext } from 'react';
import { LeagueContext } from '../context/LeagueContext.jsx';

export const useLeague = () => {
  const context = useContext(LeagueContext);
  
  if (!context) {
    throw new Error('useLeague must be used within a LeagueProvider');
  }
  
  return context;
};
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/hooks/useLeague.jsx") -content $useLeague

    # Create useChat hook
    $useChat = @"
import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket.jsx';
import { useAuth } from './useAuth.jsx';
import api from '../services/api.js';

export const useChat = (leagueId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const { socket, connected, EVENTS, joinLeague, leaveLeague, sendMessage: socketSendMessage, sendTyping } = useSocket();
  const { user } = useAuth();
  
  // Fetch chat history when component mounts or leagueId changes
  useEffect(() => {
    if (leagueId) {
      fetchMessages();
    }
    
    return () => {
      // Cleanup typing users when component unmounts
      setTypingUsers([]);
    };
  }, [leagueId]);
  
  // Join league channel when socket is connected
  useEffect(() => {
    if (socket && connected && leagueId) {
      // Join the league channel
      joinLeague(leagueId);
      
      // Socket event listeners
      socket.on(EVENTS.CHAT_MESSAGE, handleNewMessage);
      socket.on(EVENTS.USER_TYPING, handleUserTyping);
      socket.on(EVENTS.USER_JOINED, handleUserJoined);
      socket.on(EVENTS.USER_LEFT, handleUserLeft);
      
      return () => {
        // Leave the league channel and remove listeners
        leaveLeague(leagueId);
        socket.off(EVENTS.CHAT_MESSAGE, handleNewMessage);
        socket.off(EVENTS.USER_TYPING, handleUserTyping);
        socket.off(EVENTS.USER_JOINED, handleUserJoined);
        socket.off(EVENTS.USER_LEFT, handleUserLeft);
      };
    }
  }, [socket, connected, leagueId]);
  
  // Fetch message history
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/${leagueId}`);
      setMessages(response.data.reverse()); // Newest messages at the bottom
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle new message from socket
  const handleNewMessage = (message) => {
    setMessages(prev => [...prev, message]);
    
    // Remove user from typing if they just sent a message
    setTypingUsers(prev => 
      prev.filter(u => u.userId !== message.userId)
    );
  };
  
  // Handle user typing notification
  const handleUserTyping = ({ userId, username }) => {
    if (userId === user._id) return; // Ignore own typing events
    
    // Add user to typing users if not already there
    setTypingUsers(prev => {
      if (!prev.some(u => u.userId === userId)) {
        return [...prev, { userId, username }];
      }
      return prev;
    });
    
    // Remove user after a delay
    setTimeout(() => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));
    }, 3000);
  };
  
  // Handle user joined notification
  const handleUserJoined = ({ userId, username }) => {
    // Add system message
    const systemMessage = {
      _id: Date.now().toString(),
      content: `${username} joined the chat`,
      type: 'system',
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };
  
  // Handle user left notification
  const handleUserLeft = ({ userId, username }) => {
    // Add system message
    const systemMessage = {
      _id: Date.now().toString(),
      content: `${username} left the chat`,
      type: 'system',
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, systemMessage]);
    
    // Remove user from typing
    setTypingUsers(prev => prev.filter(u => u.userId !== userId));
  };
  
  // Send a new message
  const sendMessage = useCallback((content, type = 'text') => {
    if (!content || !leagueId) return;
    
    const message = {
      leagueId,
      content,
      type
    };
    
    socketSendMessage(message);
  }, [leagueId, socketSendMessage]);
  
  // Send typing indicator
  const sendTypingIndicator = useCallback(() => {
    if (leagueId) {
      sendTyping(leagueId);
    }
  }, [leagueId, sendTyping]);
  
  return {
    messages,
    loading,
    error,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    refreshMessages: fetchMessages
  };
};
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/hooks/useChat.jsx") -content $useChat

    # Create API service
    $apiService = @"
import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - redirect to login
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/services/api.js") -content $apiService

    # Create AuthService
    $authService = @"
import api from './api.js';

// Handle token management
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// Auth service functions
const AuthService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  },
  
  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  },
  
  // Logout user
  logout: () => {
    removeToken();
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    return await api.get('/auth/profile');
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    return await api.put('/auth/profile', userData);
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getToken();
  }
};

export default AuthService;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/services/authService.js") -content $authService

    # Create LeagueService
    $leagueService = @"
import api from './api.js';

const LeagueService = {
  // Get all leagues for current user
  getUserLeagues: async () => {
    return await api.get('/leagues');
  },
  
  // Get a single league by ID
  getLeagueById: async (id) => {
    return await api.get(`/leagues/${id}`);
  },
  
  // Create a new league
  createLeague: async (leagueData) => {
    return await api.post('/leagues', leagueData);
  },
  
  // Join a league with invite code
  joinLeague: async (inviteCode) => {
    return await api.post('/leagues/join', { inviteCode });
  },
  
  // Get league leaderboard
  getLeaderboard: async (leagueId) => {
    return await api.get(`/leagues/${leagueId}/leaderboard`);
  },
  
  // Update league settings
  updateLeague: async (leagueId, leagueData) => {
    return await api.put(`/leagues/${leagueId}`, leagueData);
  },
  
  // Draft a chef
  draftChef: async (leagueId, chefId) => {
    return await api.post(`/leagues/${leagueId}/draft`, { chefId });
  },
  
  // Update draft order
  updateDraftOrder: async (leagueId, draftOrder) => {
    return await api.put(`/leagues/${leagueId}/draft-order`, { draftOrder });
  }
};

export default LeagueService;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/services/leagueService.js") -content $leagueService

    # Create ChefService
    $chefService = @"
import api from './api.js';

const ChefService = {
  // Get all chefs
  getAllChefs: async () => {
    return await api.get('/chefs');
  },
  
  // Get a chef by ID
  getChefById: async (id) => {
    return await api.get(`/chefs/${id}`);
  },
  
  // Get chef stats
  getChefStats: async (id) => {
    return await api.get(`/chefs/${id}/stats`);
  }
};

export default ChefService;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/services/chefService.js") -content $chefService

    # Create ChallengeService
    $challengeService = @"
import api from './api.js';

const ChallengeService = {
  // Get all challenges
  getAllChallenges: async (season) => {
    return await api.get('/challenges', { params: { season } });
  },
  
  // Get a challenge by ID
  getChallengeById: async (id) => {
    return await api.get(`/challenges/${id}`);
  },
  
  // Get current challenges
  getCurrentChallenges: async (season) => {
    return await api.get('/challenges/current', { params: { season } });
  }
};

export default ChallengeService;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/services/challengeService.js") -content $challengeService

    # Create MessageService
    $messageService = @"
import api from './api.js';

const MessageService = {
  // Get messages for a league
  getLeagueMessages: async (leagueId, limit = 50, before = null) => {
    let params = { limit };
    if (before) {
      params.before = before;
    }
    
    return await api.get(`/messages/${leagueId}`, { params });
  },
  
  // Send a message
  sendMessage: async (leagueId, content, type = 'text') => {
    return await api.post('/messages', { leagueId, content, type });
  },
  
  // Add reaction to a message
  addReaction: async (messageId, reaction) => {
    return await api.post(`/messages/${messageId}/reaction`, { reaction });
  },
  
  // Get unread message count
  getUnreadCount: async (leagueId) => {
    return await api.get(`/messages/unread/${leagueId}`);
  }
};

export default MessageService;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/services/messageService.js") -content $messageService

    # Create MainLayout component
    $mainLayout = @"
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar.jsx';
import Header from '../components/navigation/Header.jsx';
import ChatPanel from '../components/chat/ChatPanel.jsx';
import MobileNav from '../components/navigation/MobileNav.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';

const MainLayout = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - desktop */}
      <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <Sidebar 
          user={user} 
          collapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header */}
        <Header toggleChat={toggleChat} isChatOpen={isChatOpen} />

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <Outlet />
          </main>

          {/* Chat panel */}
          <div 
            className={`border-l border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
              isChatOpen ? 'w-80 md:w-96' : 'w-0'
            } overflow-hidden`}
          >
            {isChatOpen && <ChatPanel onClose={toggleChat} />}
          </div>
        </div>

        {/* Mobile navigation */}
        <MobileNav toggleChat={toggleChat} isChatOpen={isChatOpen} />
      </div>
    </div>
  );
};

export default MainLayout;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/layouts/MainLayout.jsx") -content $mainLayout

    # Create AuthLayout component
    $authLayout = @"
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.jsx';
import Logo from '../components/ui/Logo.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

const AuthLayout = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="py-4 px-6 flex justify-between items-center">
        <Logo />
        <ThemeToggle />
      </header>
      
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
      
      <footer className="py-4 px-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Top Chef Fantasy League &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/layouts/AuthLayout.jsx") -content $authLayout

    # Create common UI components
    # Logo component
    $logoComponent = @"
import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Link to="/" className="flex items-center">
      <span className={`font-display ${sizeClasses[size]} text-primary-600 dark:text-primary-500`}>
        Top Chef Fantasy
      </span>
    </Link>
  );
};

export default Logo;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/ui/Logo.jsx") -content $logoComponent

    # Button component
    $buttonComponent = @"
import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  isLoading = false, 
  disabled = false, 
  icon = null,
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 focus:ring-gray-500',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  
  const loadingClass = isLoading ? 'opacity-80 cursor-wait' : '';
  const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${loadingClass}
        ${disabledClass}
        ${widthClass}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/ui/Button.jsx") -content $buttonComponent

    # Card component
    $cardComponent = @"
import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle, 
  action,
  className = '',
  padding = 'md',
  hover = false,
  bordered = false
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const borderClass = bordered ? 'border border-gray-200 dark:border-gray-700' : '';
  const hoverClass = hover ? 'hover:shadow-card-hover hover:-translate-y-1' : '';
  
  return (
    <div className={`
      bg-white dark:bg-gray-800 
      rounded-xl shadow-card 
      transition-all duration-200
      ${borderClass}
      ${hoverClass}
      ${className}
    `}>
      {(title || action) && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            {title && <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
};

export default Card;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/ui/Card.jsx") -content $cardComponent

    # Input component
    `$inputComponent = @"
import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  type = 'text',
  id,
  name,
  placeholder,
  required = false,
  disabled = false,
  helper,
  className = '',
  ...props
}, ref) => {
  const inputId = id || name;
  
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={inputId}
        name={name}
        className={`
          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}
          dark:text-white
        `}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
        {...props}
      />
      
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600 dark:text-red-500">
          {error}
        </p>
      )}
      
      {helper && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/ui/Input.jsx") -content `$inputComponent

    # ThemeToggle component
    $themeToggleComponent = @"
import React from 'react';
import { useTheme } from '../../hooks/useTheme.jsx';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/ui/ThemeToggle.jsx") -content $themeToggleComponent

    # LoadingScreen component
    $loadingScreenComponent = @"
import React from 'react';
import Logo from './Logo.jsx';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <Logo size="lg" />
        <div className="mt-8">
          <svg className="animate-spin h-10 w-10 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your fantasy experience...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/ui/LoadingScreen.jsx") -content $loadingScreenComponent

    # Sidebar component
    $sidebarComponent = @"
import React from 'react';
import { NavLink } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';

const Sidebar = ({ collapsed, onToggle }) => {
  const { logout } = useAuth();
  
  const getNavClasses = ({ isActive }) => {
    return `flex items-center px-4 py-3 ${collapsed ? 'justify-center' : ''} rounded-lg
      ${isActive 
        ? 'bg-primary-50 text-primary-700 dark:bg-gray-700 dark:text-primary-400' 
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}
    `;
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Logo and collapse toggle */}
      <div className={`py-4 ${collapsed ? 'px-4' : 'px-6'} flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && <Logo size="md" />}
        
        <button 
          onClick={onToggle}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Navigation links */}
      <nav className={`mt-2 flex-1 ${collapsed ? 'px-2' : 'px-4'}`}>
        <ul className="space-y-1">
          <li>
            <NavLink to="/" className={getNavClasses}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              {!collapsed && <span className="ml-3">Dashboard</span>}
            </NavLink>
          </li>
          
          <li>
            <NavLink to="/leagues" className={getNavClasses}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              {!collapsed && <span className="ml-3">Leagues</span>}
            </NavLink>
          </li>
          
          <li>
            <NavLink to="/chefs" className={getNavClasses}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              {!collapsed && <span className="ml-3">Chefs</span>}
            </NavLink>
          </li>
          
          <li>
            <NavLink to="/schedule" className={getNavClasses}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {!collapsed && <span className="ml-3">Schedule</span>}
            </NavLink>
          </li>
        </ul>
      </nav>
      
      {/* Bottom section */}
      <div className={`mt-auto ${collapsed ? 'px-2' : 'px-4'}`}>
        <div className="py-4 border-t border-gray-200 dark:border-gray-700">
          <ul className="space-y-1">
            <li>
              <NavLink to="/settings" className={getNavClasses}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                {!collapsed && <span className="ml-3">Settings</span>}
              </NavLink>
            </li>
            
            <li>
              <button 
                onClick={logout}
                className={`w-full flex items-center px-4 py-3 ${collapsed ? 'justify-center' : ''} rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 10h-3a1 1 0 110-2h3a1 1 0 110 2zm-7-4a2 2 0 100-4 2 2 0 000 4zm5 4a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a5 5 0 0110 0v2z" clipRule="evenodd" />
                </svg>
                {!collapsed && <span className="ml-3">Logout</span>}
              </button>
            </li>
            
            {!collapsed && (
              <li className="mt-3">
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/navigation/Sidebar.jsx") -content $sidebarComponent

    # Header component
    $headerComponent = @"
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLeague } from '../../hooks/useLeague.jsx';
import ThemeToggle from '../ui/ThemeToggle.jsx';

const Header = ({ toggleChat, isChatOpen }) => {
  const { user } = useAuth();
  const { currentLeague, leagues, switchLeague } = useLeague();
  
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* League selector */}
        {leagues.length > 0 && (
          <div className="relative">
            <select
              className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={currentLeague?._id || ''}
              onChange={(e) => switchLeague(e.target.value)}
            >
              {leagues.map((league) => (
                <option key={league._id} value={league._id}>
                  {league.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
        
        {/* League actions */}
        {currentLeague && (
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to={`/leagues/${currentLeague._id}`}
              className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              View Details
            </Link>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Chat toggle */}
        <button
          onClick={toggleChat}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none relative"
          aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {/* Notification badge - can be conditionally rendered */}
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-primary-500"></span>
        </button>
        
        {/* Theme toggle - visible on desktop */}
        <div className="hidden md:block">
          <ThemeToggle />
        </div>
        
        {/* User menu */}
        <div className="relative">
          <Link to="/settings" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center text-primary-700 dark:text-primary-300">
              {user?.name?.charAt(0) || '?'}
            </div>
            <span className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.name || 'User'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/navigation/Header.jsx") -content $headerComponent

    # Mobile Navigation component
    $mobileNavComponent = @"
import React from 'react';
import { NavLink } from 'react-router-dom';

const MobileNav = ({ toggleChat, isChatOpen }) => {
  const getNavClasses = ({ isActive }) => {
    return `flex flex-col items-center justify-center text-xs
      ${isActive 
        ? 'text-primary-600 dark:text-primary-400' 
        : 'text-gray-600 dark:text-gray-400'}
    `;
  };
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-around px-4">
      <NavLink to="/" className={getNavClasses}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span className="mt-1">Home</span>
      </NavLink>
      
      <NavLink to="/leagues" className={getNavClasses}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="mt-1">Leagues</span>
      </NavLink>
      
      <button 
        onClick={toggleChat}
        className="flex flex-col items-center justify-center text-xs text-gray-600 dark:text-gray-400 focus:outline-none relative"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="mt-1">Chat</span>
        
        {/* Notification badge - conditionally rendered */}
        <span className="absolute top-0 right-2 h-2 w-2 rounded-full bg-primary-500"></span>
      </button>
      
      <NavLink to="/chefs" className={getNavClasses}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="mt-1">Chefs</span>
      </NavLink>
      
      <NavLink to="/settings" className={getNavClasses}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="mt-1">Settings</span>
      </NavLink>
    </div>
  );
};

export default MobileNav;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/navigation/MobileNav.jsx") -content $mobileNavComponent

    # ChatPanel component
    $chatPanelComponent = @"
import React, { useState, useEffect, useRef } from 'react';
import { useLeague } from '../../hooks/useLeague.jsx';
import { useChat } from '../../hooks/useChat.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import ChatMessage from './ChatMessage.jsx';

const ChatPanel = ({ onClose }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { currentLeague } = useLeague();
  const { user } = useAuth();
  
  const {
    messages,
    loading,
    error,
    typingUsers,
    sendMessage,
    sendTypingIndicator
  } = useChat(currentLeague?._id);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && currentLeague) {
      sendMessage(message);
      setMessage('');
    }
  };
  
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    sendTypingIndicator();
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">League Chat</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
          aria-label="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 dark:text-red-400">
            {error}
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <ChatMessage
                  key={msg._id}
                  message={msg}
                  isOwnMessage={msg.sender?._id === user?._id}
                />
              ))
            )}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                {typingUsers.length === 1
                  ? `${typingUsers[0].username} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="Type a message..."
            value={message}
            onChange={handleInputChange}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!message.trim() || !currentLeague}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/chat/ChatPanel.jsx") -content $chatPanelComponent

    # ChatMessage component
    $chatMessageComponent = @"
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const ChatMessage = ({ message, isOwnMessage }) => {
  // Format the timestamp
  const formattedTime = message.createdAt
    ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
    : '';
  
  // System message
  if (message.type === 'system') {
    return (
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
        {message.content}
      </div>
    );
  }
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 py-2 inline-block ${
            isOwnMessage
              ? 'bg-primary-600 text-white rounded-br-none'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
          }`}
        >
          {!isOwnMessage && (
            <div className="font-medium text-xs mb-1">
              {message.sender?.name || 'Unknown'}
            </div>
          )}
          <div className="break-words">{message.content}</div>
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {formattedTime}
        </div>
      </div>
      
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isOwnMessage ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
        {!isOwnMessage && (
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-700 dark:text-gray-300">
            {message.sender?.name?.charAt(0) || '?'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/chat/ChatMessage.jsx") -content $chatMessageComponent

    # ProtectedRoute component
    $protectedRouteComponent = @"
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.jsx';
import LoadingScreen from '../ui/LoadingScreen.jsx';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/components/auth/ProtectedRoute.jsx") -content $protectedRouteComponent

    # Page components - Login.jsx
    $loginPage = @"
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, loading, error, setError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }
    
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <Card padding="lg" className="animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
        <p className="text-gray-600 dark:text-gray-400">Log in to your Top Chef Fantasy account</p>
      </div>
      
      {(error || formError) && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error || formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Email Address"
          type="email"
          id="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input
          label="Password"
          type="password"
          id="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>
          
          <div className="text-sm">
            <Link to="/forgot-password" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Forgot your password?
            </Link>
          </div>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={loading}
        >
          Sign In
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </Card>
  );
};

export default Login;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/pages/Login.jsx") -content $loginPage

    # Register.jsx
    $registerPage = @"
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const { register, loading, error } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Form validation
    if (!name || !email || !password || !confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    try {
      await register({ name, email, password });
    } catch (err) {
      console.error('Registration error:', err);
    }
  };
  
  return (
    <Card padding="lg" className="animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create an Account</h1>
        <p className="text-gray-600 dark:text-gray-400">Join the Top Chef Fantasy community</p>
      </div>
      
      {(error || formError) && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
          {error || formError}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Name"
          type="text"
          id="name"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        
        <Input
          label="Email Address"
          type="email"
          id="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <Input
          label="Password"
          type="password"
          id="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helper="Password must be at least 6 characters"
          required
        />
        
        <Input
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        
        <div className="mb-6">
          <div className="flex items-center">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              required
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              I agree to the{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                Privacy Policy
              </a>
            </label>
          </div>
        </div>
        
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={loading}
        >
          Create Account
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  );
};

export default Register;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/pages/Register.jsx") -content $registerPage

    # Not Found Page
    `$notFoundPage = @"
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-display font-bold text-primary-600 dark:text-primary-500">404</h1>
        <p className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-4">Page Not Found</p>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="mt-8">
          <Link to="/">
            <Button variant="primary" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/pages/NotFound.jsx") -content `$notFoundPage

    # Dashboard Page
    $dashboardPage = @"
import React, { useEffect } from 'react';
import { useLeague } from '../hooks/useLeague.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { currentLeague, leaderboard, loading, error, fetchLeagueDetails } = useLeague();
  
  useEffect(() => {
    if (currentLeague?._id) {
      fetchLeagueDetails(currentLeague._id);
    }
  }, [currentLeague?._id]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (!currentLeague) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl font-display text-primary-600 mb-4">Welcome!</div>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          It looks like you're not part of any leagues yet. Create or join a league to get started!
        </p>
        <div className="flex space-x-4">
          <Link to="/leagues">
            <Button variant="primary">Browse Leagues</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Link to={`/leagues/${currentLeague._id}`}>
          <Button variant="outline" size="sm">League Details</Button>
        </Link>
      </div>
      
      {/* League Overview */}
      <Card title={currentLeague.name} subtitle={`Season ${currentLeague.season}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">League Status</div>
            <div className="text-xl font-semibold mt-1 capitalize">{currentLeague.status}</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Week</div>
            <div className="text-xl font-semibold mt-1">Week {currentLeague.currentWeek}</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Members</div>
            <div className="text-xl font-semibold mt-1">
              {currentLeague.members?.length || 0} / {currentLeague.maxMembers}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Leaderboard */}
      <Card title="Leaderboard" subtitle="Current standings">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Player</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roster Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <tr key={entry.user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {entry.user.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {entry.score}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {entry.rosterCount} / {currentLeague.maxRosterSize}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No leaderboard data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Quick Actions">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Manage your fantasy experience with these quick actions
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/chefs">
                <Button variant="secondary" size="sm">View Chefs</Button>
              </Link>
              <Link to="/schedule">
                <Button variant="secondary" size="sm">View Schedule</Button>
              </Link>
              <Button variant="outline" size="sm">Manage Roster</Button>
            </div>
          </div>
        </Card>
        
        <Card title="Current Challenge" subtitle={`Week ${currentLeague.currentWeek}`}>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Make your picks for this week's challenge before it airs!
            </p>
            <Button variant="primary" size="sm">Make Predictions</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/pages/Dashboard.jsx") -content $dashboardPage

    # Create TypeScript configuration file
    $tsConfig = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "allowJs": true,
    "checkJs": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "tsconfig.json") -content $tsConfig

    # Create TSConfig for Node.js
    $tsConfigNode = @"
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.js"]
}
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "tsconfig.node.json") -content $tsConfigNode

    # Create eslint configuration
    $eslintConfig = @"
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '19.0' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/prop-types': 'off',
  },
}
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath ".eslintrc.cjs") -content $eslintConfig

    # Create README.md files
    $rootReadme = @"
# Top Chef Fantasy Application

A full-stack application for Top Chef fans to create and join fantasy leagues, draft chefs, track performance, and compete with friends.

## Technologies Used

### Frontend
- Vite 6.2.2 with React 19.0.10
- TailwindCSS for styling
- React Router for navigation
- Socket.io client for real-time updates

### Backend
- Express.js
- MongoDB Atlas for database
- Socket.io for real-time communication
- JWT authentication

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### Installation

1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/top-chef-fantasy.git
cd top-chef-fantasy
\`\`\`

2. Install dependencies for both frontend and backend
\`\`\`bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
\`\`\`

3. Set up environment variables
- Create a .env file in the server directory based on .env.example
- Create a .env file in the client directory based on .env.example

4. Start the development servers
\`\`\`bash
# Start backend server
cd server
npm run dev

# Start frontend development server
cd ../client
npm run dev
\`\`\`

5. Access the application at http://localhost:5173

## Deployment

The application is set up for deployment on Render.com using the provided render.yaml file.

## Project Structure

- `/client` - Frontend React application
- `/server` - Backend Express application
  - `/src/models` - MongoDB schemas
  - `/src/controllers` - API controllers
  - `/src/routes` - API routes
  - `/src/middleware` - Express middleware
  - `/src/socket` - Socket.io implementation
"@
    New-File -path (Join-Path -Path $rootDir -ChildPath "README.md") -content $rootReadme

    # Create .gitignore
    $gitignore = @"
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
build
dist
dist-ssr

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
"@
    New-File -path (Join-Path -Path $rootDir -ChildPath ".gitignore") -content $gitignore

    # Create logo.svg
    $logoSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="45" fill="#f59e0b" />
  <text x="50" y="50" font-size="50" text-anchor="middle" dominant-baseline="central" fill="white" font-family="Arial, sans-serif" font-weight="bold">TC</text>
  <text x="50" y="70" font-size="16" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">FANTASY</text>
</svg>
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "public/logo.svg") -content $logoSvg
    
    # Create the remaining frontend pages
    Write-Host "`n[Creating remaining frontend pages...]" -ForegroundColor Magenta

    # ChefRoster.jsx
    $chefRosterPage = @"
import React, { useEffect, useState } from 'react';
import { useLeague } from '../hooks/useLeague.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

const ChefRoster = () => {
  const { chefs, currentLeague, loading, error, fetchLeagueDetails } = useLeague();
  const [selectedChef, setSelectedChef] = useState(null);
  
  useEffect(() => {
    if (currentLeague?._id) {
      fetchLeagueDetails(currentLeague._id);
    }
  }, [currentLeague?._id]);
  
  const handleSelectChef = (chef) => {
    setSelectedChef(chef);
  };
  
  const closeChefDetails = () => {
    setSelectedChef(null);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chef Roster</h1>
        {currentLeague && currentLeague.status === 'draft' && (
          <Button variant="primary" size="sm">Draft Chef</Button>
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Chef Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {chefs && chefs.length > 0 ? (
          chefs.map((chef) => (
            <Card 
              key={chef._id} 
              className="cursor-pointer card-hover"
              onClick={() => handleSelectChef(chef)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  {chef.image ? (
                    <img 
                      src={chef.image} 
                      alt={chef.name} 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-2xl text-gray-600 dark:text-gray-400">
                      {chef.name.charAt(0)}
                    </span>
                  )}
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{chef.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{chef.specialty}</p>
                  
                  <div className="mt-2 flex items-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      chef.status === 'active' ? 
                        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                      chef.status === 'eliminated' ?
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {chef.status}
                    </span>
                    
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {chef.stats.totalPoints} pts
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">
            No chefs available.
          </div>
        )}
      </div>
      
      {/* Chef Details Modal */}
      {selectedChef && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedChef.name}</h2>
                <button
                  onClick={closeChefDetails}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-1/3">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                      {selectedChef.image ? (
                        <img 
                          src={selectedChef.image} 
                          alt={selectedChef.name} 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-6xl text-gray-600 dark:text-gray-400">
                          {selectedChef.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <p className="font-medium capitalize">{selectedChef.status}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Specialty</span>
                        <p className="font-medium">{selectedChef.specialty}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Hometown</span>
                        <p className="font-medium">{selectedChef.hometown}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-2/3">
                    <h3 className="font-medium text-lg mb-3">Bio</h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">{selectedChef.bio}</p>
                    
                    <h3 className="font-medium text-lg mb-3">Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Challenge Wins</span>
                        <p className="text-xl font-semibold">{selectedChef.stats.challengeWins}</p>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Quickfire Wins</span>
                        <p className="text-xl font-semibold">{selectedChef.stats.quickfireWins}</p>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Points</span>
                        <p className="text-xl font-semibold">{selectedChef.stats.totalPoints}</p>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Eliminations</span>
                        <p className="text-xl font-semibold">{selectedChef.stats.eliminations}</p>
                      </div>
                    </div>
                    
                    {currentLeague && currentLeague.status === 'draft' && (
                      <div className="mt-6">
                        <Button variant="primary" fullWidth>Draft Chef</Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Weekly Performance */}
                <div>
                  <h3 className="font-medium text-lg mb-3">Weekly Performance</h3>
                  {selectedChef.weeklyPerformance && selectedChef.weeklyPerformance.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Week</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Highlights</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedChef.weeklyPerformance.map((week) => (
                            <tr key={week.week} className="border-b border-gray-200 dark:border-gray-700">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                Week {week.week}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {week.points}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                {week.rank}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                {week.highlights}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No performance data available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefRoster;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/pages/ChefRoster.jsx") -content $chefRosterPage

    # Leagues.jsx
    $leaguesPage = @"
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeague } from '../hooks/useLeague.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';

const Leagues = () => {
  const { leagues, loading, error, fetchUserLeagues, createLeague, joinLeagueWithCode } = useLeague();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newLeague, setNewLeague] = useState({
    name: '',
    season: 22,
    maxMembers: 10,
    maxRosterSize: 5
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUserLeagues();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!newLeague.name) {
      setFormError('Please provide a league name');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await createLeague(newLeague);
      setIsCreateModalOpen(false);
      setNewLeague({
        name: '',
        season: 22,
        maxMembers: 10,
        maxRosterSize: 5
      });
    } catch (err) {
      console.error('Error creating league:', err);
      setFormError(err.response?.data?.message || 'Failed to create league');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!joinCode) {
      setFormError('Please provide an invite code');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await joinLeagueWithCode(joinCode);
      setIsJoinModalOpen(false);
      setJoinCode('');
    } catch (err) {
      console.error('Error joining league:', err);
      setFormError(err.response?.data?.message || 'Failed to join league');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Leagues</h1>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setIsJoinModalOpen(true)}
          >
            Join League
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create League
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : leagues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((league) => (
            <Card 
              key={league._id}
              className="card-hover"
              padding="none"
            >
              <Link to={`/leagues/${league._id}`} className="block">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {league.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Season {league.season}
                  </p>
                </div>
                
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Status</span>
                      <p className="font-medium capitalize">{league.status}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Current Week</span>
                      <p className="font-medium">Week {league.currentWeek}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Members</span>
                      <p className="font-medium">{league.members?.length || 0} / {league.maxMembers}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">Roster Size</span>
                      <p className="font-medium">{league.maxRosterSize} chefs</p>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Created {new Date(league.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      View League &rarr;
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No leagues yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create a new league or join an existing one.
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setIsJoinModalOpen(true)}
            >
              Join League
            </Button>
            <Button 
              variant="primary" 
              onClick={() => setIsCreateModalOpen(true)}
            >
              Create League
            </Button>
          </div>
        </div>
      )}
      
      {/* Create League Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New League</h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleCreateSubmit}>
                <Input
                  label="League Name"
                  id="name"
                  placeholder="Enter league name"
                  value={newLeague.name}
                  onChange={(e) => setNewLeague({...newLeague, name: e.target.value})}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Season"
                    id="season"
                    type="number"
                    min="1"
                    placeholder="Season number"
                    value={newLeague.season}
                    onChange={(e) => setNewLeague({...newLeague, season: parseInt(e.target.value)})}
                    required
                  />
                  
                  <Input
                    label="Max Members"
                    id="maxMembers"
                    type="number"
                    min="2"
                    max="20"
                    placeholder="Maximum members"
                    value={newLeague.maxMembers}
                    onChange={(e) => setNewLeague({...newLeague, maxMembers: parseInt(e.target.value)})}
                    required
                  />
                </div>
                
                <Input
                  label="Max Roster Size"
                  id="maxRosterSize"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Chefs per roster"
                  value={newLeague.maxRosterSize}
                  onChange={(e) => setNewLeague({...newLeague, maxRosterSize: parseInt(e.target.value)})}
                  required
                />
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    Create League
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Join League Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Join a League</h2>
                <button
                  onClick={() => setIsJoinModalOpen(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleJoinSubmit}>
                <Input
                  label="Invite Code"
                  id="inviteCode"
                  placeholder="Enter the league invite code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  required
                />
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsJoinModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                  >
                    Join League
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leagues;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/pages/Leagues.jsx") -content $leaguesPage

    # LeagueDetail.jsx
    $leagueDetailPage = @"
import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useLeague } from '../hooks/useLeague.jsx';
import { useChat } from '../hooks/useChat.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

const LeagueDetail = () => {
  const { id } = useParams();
  const { leagues, currentLeague, leaderboard, loading, error, fetchLeagueDetails, switchLeague } = useLeague();
  const [activeTab, setActiveTab] = useState('overview');
  const { messages, sendMessage } = useChat(id);
  const [chatInput, setChatInput] = useState('');
  
  useEffect(() => {
    if (id) {
      // If the ID doesn't match the current league, switch to it
      if (!currentLeague || currentLeague._id !== id) {
        switchLeague(id);
      }
      
      // Fetch the league details
      fetchLeagueDetails(id);
    }
  }, [id]);
  
  // Check if the league ID exists in the user's leagues
  const leagueExists = leagues.some(league => league._id === id);
  
  if (!leagueExists && !loading) {
    return <Navigate to="/leagues" />;
  }
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() && id) {
      sendMessage(chatInput.trim());
      setChatInput('');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
        {error}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* League Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentLeague?.name}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Season {currentLeague?.season} • {currentLeague?.members?.length || 0} Members
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              Invite
            </Button>
            <Button variant="primary" size="sm">
              {currentLeague?.status === 'draft' ? 'Start Draft' : 'Manage League'}
            </Button>
          </div>
        </div>
        
        {/* League Status Badge */}
        <div className="mt-4">
          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
            currentLeague?.status === 'draft' ? 
              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
            currentLeague?.status === 'active' ?
              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
              'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
          }`}>
            {currentLeague?.status} • Week {currentLeague?.currentWeek}
          </span>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'overview' ? 
                'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 
                'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'members' ? 
                'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 
                'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('members')}
          >
            Members
          </button>
          
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'settings' ? 
                'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 
                'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
          
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'chat' ? 
                'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 
                'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* League Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="League Status" className="text-center">
                  <div className="text-3xl font-bold mb-2 capitalize">
                    {currentLeague?.status}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentLeague?.status === 'draft' ? 
                      'Draft in progress' : 
                      `Week ${currentLeague?.currentWeek} of competition`}
                  </p>
                </Card>
                
                <Card title="Scoring System" className="text-center">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Challenge Win</span>
                      <span className="font-medium">{currentLeague?.scoringSettings?.challengeWin || 20} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quickfire Win</span>
                      <span className="font-medium">{currentLeague?.scoringSettings?.quickfireWin || 10} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Top Three</span>
                      <span className="font-medium">{currentLeague?.scoringSettings?.topThree || 5} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bottom Three</span>
                      <span className="font-medium">{currentLeague?.scoringSettings?.bottomThree || -5} pts</span>
                    </div>
                  </div>
                </Card>
                
                <Card title="Invite Code" className="text-center">
                  <div className="bg-gray-100 dark:bg-gray-700 py-2 px-4 rounded-lg font-mono text-lg mb-2">
                    {currentLeague?.inviteCode}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigator.clipboard.writeText(currentLeague?.inviteCode)}
                  >
                    Copy to Clipboard
                  </Button>
                </Card>
              </div>
              
              {/* Leaderboard */}
              <Card title="Leaderboard">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Player</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roster Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {leaderboard && leaderboard.length > 0 ? (
                        leaderboard.map((entry, index) => (
                          <tr key={entry.user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {entry.user.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {entry.score}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {entry.rosterCount} / {currentLeague.maxRosterSize}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                            No leaderboard data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
          
          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {currentLeague?.members && currentLeague.members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentLeague.members.map((member) => (
                    <Card key={member.user._id}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-medium">
                          {member.user.name?.charAt(0) || '?'}
                        </div>
                        
                        <div>
                          <h3 className="font-medium">{member.user.name}</h3>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              member.role === 'owner' ? 
                                'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400' : 
                              member.role === 'admin' ?
                                'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                            }`}>
                              {member.role}
                            </span>
                            
                            <span className="text-gray-600 dark:text-gray-400">
                              Score: {member.score}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No members in this league yet.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card title="League Settings">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Only league owners and admins can modify league settings.
                </p>
                
                {/* League settings form would go here */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      League Name
                    </label>
                    <input
                      type="text"
                      value={currentLeague?.name}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Season
                    </label>
                    <input
                      type="number"
                      value={currentLeague?.season}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Members
                    </label>
                    <input
                      type="number"
                      value={currentLeague?.maxMembers}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Roster Size
                    </label>
                    <input
                      type="number"
                      value={currentLeague?.maxRosterSize}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                </div>
                
                <Button
                  variant="primary"
                  className="mt-6"
                  disabled
                >
                  Update Settings
                </Button>
              </Card>
              
              <Card title="Danger Zone" className="border border-red-300 dark:border-red-700">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  These actions cannot be undone. Please be certain.
                </p>
                
                <Button
                  variant="danger"
                  disabled
                >
                  Leave League
                </Button>
              </Card>
            </div>
          )}
          
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto flex flex-col space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message._id} className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {message.sender?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="pl-6 text-gray-700 dark:text-gray-300">
                        {message.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>
              
              <form onSubmit={handleSendMessage} className="flex">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-r-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!chatInput.trim()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueDetail;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/pages/LeagueDetail.jsx") -content $leagueDetailPage

    # Schedule.jsx
    $schedulePage = @"
import React, { useEffect, useState } from 'react';
import { useLeague } from '../hooks/useLeague.jsx';
import Card from '../components/ui/Card.jsx';

const Schedule = () => {
  const { challenges, currentLeague, loading, error, fetchLeagueDetails } = useLeague();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  
  useEffect(() => {
    if (currentLeague?._id) {
      fetchLeagueDetails(currentLeague._id);
    }
  }, [currentLeague?._id]);
  
  const handleSelectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
  };
  
  const closeDetails = () => {
    setSelectedChallenge(null);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Challenge Schedule</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {!currentLeague ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No league selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a league to view challenge schedule.
          </p>
        </div>
      ) : challenges && challenges.length > 0 ? (
        <div className="space-y-6">
          {/* Current Week */}
          <Card title={`Current Week: Week ${currentLeague.currentWeek}`}>
            <div className="space-y-4">
              {challenges
                .filter(challenge => challenge.week === currentLeague.currentWeek)
                .map(challenge => (
                  <div
                    key={challenge._id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSelectChallenge(challenge)}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{challenge.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            challenge.isQuickfire ? 
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                              'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                          }`}>
                            {challenge.isQuickfire ? 'Quickfire' : 'Elimination'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {challenge.location} • {new Date(challenge.airDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          challenge.status === 'upcoming' ? 
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {challenge.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
          
          {/* All Weeks */}
          <Card title="Season Schedule">
            <div className="space-y-6">
              {Array.from(new Set(challenges.map(c => c.week))).sort((a, b) => a - b).map(week => (
                <div key={week} className="space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">Week {week}</h3>
                  
                  <div className="space-y-2 ml-4">
                    {challenges
                      .filter(challenge => challenge.week === week)
                      .map(challenge => (
                        <div
                          key={challenge._id}
                          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSelectChallenge(challenge)}
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{challenge.title}</h4>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  challenge.isQuickfire ? 
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                                    'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                                }`}>
                                  {challenge.isQuickfire ? 'Quickfire' : 'Elimination'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {challenge.location} • {new Date(challenge.airDate).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                challenge.status === 'upcoming' ? 
                                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                                {challenge.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No challenges available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no challenges scheduled for this league yet.
          </p>
        </div>
      )}
      
      {/* Challenge Details Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedChallenge.title}</h2>
                <button
                  onClick={closeDetails}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedChallenge.isQuickfire ? 
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                    'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                }`}>
                  {selectedChallenge.isQuickfire ? 'Quickfire' : 'Elimination'}
                </span>
                
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  selectedChallenge.status === 'upcoming' ? 
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                }`}>
                  {selectedChallenge.status}
                </span>
              </div>
              
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-2">Challenge Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                      <p className="font-medium">{selectedChallenge.location}</p>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Air Date</span>
                      <p className="font-medium">{new Date(selectedChallenge.airDate).toLocaleDateString()}</p>
                    </div>
                    
                    {selectedChallenge.guest && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Guest Judge</span>
                        <p className="font-medium">{selectedChallenge.guest}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedChallenge.description}</p>
                </div>
                
                {selectedChallenge.status === 'completed' && (
                  <div>
                    <h3 className="font-medium text-lg mb-2">Results</h3>
                    
                    {selectedChallenge.winner && (
                      <div className="mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Winner</span>
                        <p className="font-medium">{selectedChallenge.winner.name}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedChallenge.topChefs && selectedChallenge.topChefs.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Top Performers</span>
                          <ul className="mt-1 space-y-1">
                            {selectedChallenge.topChefs.map(chef => (
                              <li key={chef._id} className="text-gray-700 dark:text-gray-300">
                                {chef.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {selectedChallenge.bottomChefs && selectedChallenge.bottomChefs.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Bottom Performers</span>
                          <ul className="mt-1 space-y-1">
                            {selectedChallenge.bottomChefs.map(chef => (
                              <li key={chef._id} className="text-gray-700 dark:text-gray-300">
                                {chef.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {selectedChallenge.eliminatedChef && (
                      <div className="mt-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Eliminated</span>
                        <p className="font-medium text-red-600 dark:text-red-400">
                          {selectedChallenge.eliminatedChef.name}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/pages/Schedule.jsx") -content $schedulePage

    # Settings.jsx
    `$settingsPage = @"
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

const Settings = () => {
  const { user, updateProfile, error: authError, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [section, setSection] = useState('profile');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    // Basic validation
    if (!formData.name || !formData.email) {
      setFormError('Name and email are required');
      return;
    }
    
    try {
      await updateProfile({
        name: formData.name,
        email: formData.email
      });
      
      setFormSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Profile update error:', err);
      setFormError(err.response?.data?.message || 'Failed to update profile');
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    // Password validation
    if (!formData.currentPassword) {
      setFormError('Current password is required');
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setFormError('New passwords do not match');
      return;
    }
    
    if (formData.newPassword && formData.newPassword.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    try {
      await updateProfile({
        password: formData.newPassword,
        currentPassword: formData.currentPassword
      });
      
      setFormSuccess('Password updated successfully');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Password update error:', err);
      setFormError(err.response?.data?.message || 'Failed to update password');
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          className={`px-4 py-2 border-b-2 ${
            section === 'profile' ? 
              'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 
              'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setSection('profile')}
        >
          Profile
        </button>
        
        <button
          className={`px-4 py-2 border-b-2 ${
            section === 'password' ? 
              'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 
              'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setSection('password')}
        >
          Password
        </button>
        
        <button
          className={`px-4 py-2 border-b-2 ${
            section === 'preferences' ? 
              'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 
              'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setSection('preferences')}
        >
          Preferences
        </button>
      </div>
      
      {/* Profile Settings */}
      {section === 'profile' && (
        <Card>
          {(authError || formError) && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
              {authError || formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
              {formSuccess}
            </div>
          )}
          
          <form onSubmit={handleProfileSubmit}>
            <Input
              label="Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            
            <Input
              label="Email Address"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
            >
              Update Profile
            </Button>
          </form>
        </Card>
      )}
      
      {/* Password Settings */}
      {section === 'password' && (
        <Card>
          {(authError || formError) && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
              {authError || formError}
            </div>
          )}
          
          {formSuccess && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
              {formSuccess}
            </div>
          )}
          
          <form onSubmit={handlePasswordSubmit}>
            <Input
              label="Current Password"
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              required
            />
            
            <Input
              label="New Password"
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              helper="Password must be at least 6 characters"
              required
            />
            
            <Input
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
            
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
            >
              Update Password
            </Button>
          </form>
        </Card>
      )}
      
      {/* Preferences */}
      {section === 'preferences' && (
        <div className="space-y-6">
          <Card title="Theme Preferences">
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Toggle between light and dark theme
                </p>
              </div>
              
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                <input
                  type="checkbox"
                  id="toggle"
                  name="toggle"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  className="absolute w-0 h-0 opacity-0"
                />
                <label
                  htmlFor="toggle"
                  className="block h-6 overflow-hidden rounded-full cursor-pointer bg-gray-300 dark:bg-gray-600"
                >
                  <span
                    className={`absolute top-0 left-0 w-6 h-6 rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                      theme === 'dark' ? 'translate-x-6 bg-primary-500' : 'translate-x-0 bg-white'
                    }`}
                  ></span>
                </label>
              </div>
            </div>
          </Card>
          
          <Card title="Notification Preferences">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive updates about your leagues and challenges
                  </p>
                </div>
                
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    name="emailNotifications"
                    className="absolute w-0 h-0 opacity-0"
                  />
                  <label
                    htmlFor="emailNotifications"
                    className="block h-6 overflow-hidden rounded-full cursor-pointer bg-gray-300 dark:bg-gray-600"
                  >
                    <span
                      className="absolute top-0 left-0 w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out"
                    ></span>
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="font-medium">Push Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive alerts on your device
                  </p>
                </div>
                
                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    name="pushNotifications"
                    className="absolute w-0 h-0 opacity-0"
                  />
                  <label
                    htmlFor="pushNotifications"
                    className="block h-6 overflow-hidden rounded-full cursor-pointer bg-gray-300 dark:bg-gray-600"
                  >
                    <span
                      className="absolute top-0 left-0 w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out"
                    ></span>
                  </label>
                </div>
              </div>
            </div>
            
            <Button
              variant="primary"
              className="mt-6"
              disabled
            >
              Save Preferences
            </Button>
          </Card>
          
          <Card title="Danger Zone" className="border border-red-300 dark:border-red-700">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Deleting your account will remove all your data. This action cannot be undone.
            </p>
            
            <Button
              variant="danger"
              disabled
            >
              Delete Account
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath "src/pages/Settings.jsx") -content `$settingsPage

    # Create .env.example files for frontend and backend
    $frontendEnvExample = @"
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
"@
    New-File -path (Join-Path -Path $frontendDir -ChildPath ".env.example") -content $frontendEnvExample

    $backendEnvExample = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/topcheffantasy?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# CORS Configuration
CLIENT_URL=http://localhost:5173
"@
    New-File -path (Join-Path -Path $backendDir -ChildPath ".env.example") -content $backendEnvExample

    # Create VSCode settings for better development experience
    $vscodeSettings = @"
{
  "editor.formatOnSave": true,
  "editor.tabSize": 2,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact"],
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.jsx": "javascriptreact"
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "javascriptreact": "javascriptreact"
  },
  "tailwindCSS.emmetCompletions": true
}
"@
    $vscodeDir = Join-Path -Path $rootDir -ChildPath ".vscode"
    if (-not (Test-Path $vscodeDir)) {
        New-Directory -path $vscodeDir
    }
    New-File -path (Join-Path -Path $vscodeDir -ChildPath "settings.json") -content $vscodeSettings

    # Create start.bat for Windows users
    $startBatContent = @"
@echo off
echo Starting Top Chef Fantasy application...

echo.
echo Starting backend server...
start cmd /k "cd server && npm install && npm run dev"

echo.
echo Starting frontend development server...
start cmd /k "cd client && npm install && npm run dev"

echo.
echo Application started successfully!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
"@
    New-File -path (Join-Path -Path $rootDir -ChildPath "start.bat") -content $startBatContent

    # Create start.sh for Unix/Linux/macOS users
    $startShContent = @"
#!/bin/bash

echo "Starting Top Chef Fantasy application..."

echo ""
echo "Starting backend server..."
cd server && npm install && npm run dev &

echo ""
echo "Starting frontend development server..."
cd client && npm install && npm run dev &

echo ""
echo "Application started successfully!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
"@
    New-File -path (Join-Path -Path $rootDir -ChildPath "start.sh") -content $startShContent

    # Display success message
    Write-Host "`n[Setup completed successfully!]" -ForegroundColor Green
    Write-Host "`nTo start the application:" -ForegroundColor Yellow
    
    Write-Host "`nOption 1: Run the start script"
    Write-Host "For Windows: start.bat"
    Write-Host "For Unix/Linux/macOS: bash start.sh"
    
    Write-Host "`nOption 2: Start servers manually"
    Write-Host "`nBackend Server:"
    Write-Host "cd server"
    Write-Host "npm install"
    Write-Host "npm run dev"
    
    Write-Host "`nFrontend Dev Server:"
    Write-Host "cd client"
    Write-Host "npm install"
    Write-Host "npm run dev"
    
    Write-Host "`nAccess the application at: http://localhost:5173" -ForegroundColor Cyan
    
    Write-Host "`nIMPORTANT: Don't forget to update the MongoDB connection string in server/.env before starting the application." -ForegroundColor Yellow
}

# Execute the main function
Main

# Execute the main function
Main

