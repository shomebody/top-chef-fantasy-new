import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import portfinder from 'portfinder'; // Added for dynamic port finding
import { createLogger, format, transports } from 'winston'; // Advanced logging

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import chefRoutes from './routes/chefRoutes.js';
import leagueRoutes from './routes/leagueRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import setupSocket from './socket/index.js';

// Load environment variables
dotenv.config();

// Configure advanced logging with Winston
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
    new transports.File({ filename: 'logs/combined.log' })
  ],
});

// Graceful shutdown handler
const gracefulShutdown = (server, signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed.');
      process.exit(0);
    });
  });
};

// Main server startup function
const startServer = async () => {
  try {
    // Connect to MongoDB with retry logic
    await connectDB();
    logger.info('MongoDB connected successfully');

    // Initialize Express app and HTTP server
    const app = express();
    const server = http.createServer(app);

    // Configure Socket.IO with enhanced options
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173', // Fallback for dev
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      },
      pingTimeout: 60000, // Increase timeout for stability
      pingInterval: 25000,
    });

    // Setup Socket.IO logic
    setupSocket(io);

    // Middleware
    app.use(express.json({ limit: '10mb' })); // Limit payload size
    app.use(express.urlencoded({ extended: true }));
    app.use(cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    }));
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust based on needs
        },
      },
    }));
    app.use(morgan('dev', {
      stream: { write: (message) => logger.info(message.trim()) }, // Pipe Morgan to Winston
    }));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/chefs', chefRoutes);
    app.use('/api/leagues', leagueRoutes);
    app.use('/api/challenges', challengeRoutes);

    // Welcome route
    app.get('/', (req, res) => {
      res.send('Top Chef Fantasy API is running...');
    });

    // Error handling middleware
    app.use(notFound);
    app.use((err, req, res, next) => {
      logger.error(`Server Error: ${err.message}`, { stack: err.stack });
      const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
      res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    });

    // Dynamically find an available port if needed
    const basePort = parseInt(process.env.PORT, 10) || 5000;
    portfinder.basePort = basePort;
    const port = await portfinder.getPortPromise();

    // Start the server
    server.listen(port, () => {
      logger.info(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    // Handle server errors (e.g., EADDRINUSE)
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is in use, attempting to find another...`);
        portfinder.getPortPromise().then((newPort) => {
          server.listen(newPort, () => {
            logger.info(`Server switched to port ${newPort}`);
          });
        });
      } else {
        logger.error('Server error:', err);
        throw err;
      }
    });

    // Graceful shutdown on signals
    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, () => gracefulShutdown(server, signal));
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown(server, 'unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown(server, 'uncaughtException');
    });

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();
