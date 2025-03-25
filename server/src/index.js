// server/src/index.js
import admin, { db, auth } from './config/firebase.js';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import portfinder from 'portfinder';
import { createLogger, format, transports } from 'winston';
import setupSocket from './socket/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Configure logging with Winston
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

// Graceful shutdown handler
const gracefulShutdown = (server, io, signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  io.close(() => {
    logger.info('Socket.IO connections closed.');
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  });
};

// Main server startup function
const startServer = async () => {
  try {
    // Initialize Express app and HTTP server
    const app = express();
    const server = http.createServer(app);

    // Configure Socket.IO
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Setup Socket.IO with Firebase
    setupSocket(io, db, auth);

    // Middleware
    app.use(express.json({ limit: '10mb' }));
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
          scriptSrc: ["'self'", "'unsafe-inline'"],
        },
      },
    }));
    app.use(morgan('dev', {
      stream: { write: (message) => logger.info(message.trim()) },
    }));

    // Health check endpoint with Firebase status
    app.get('/health', async (req, res) => {
      try {
        await db.collection('health').doc('status').set({ lastChecked: admin.firestore.FieldValue.serverTimestamp() });
        res.status(200).json({
          status: 'healthy',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).json({ status: 'unhealthy', error: error.message });
      }
    });

    // API Routes
    app.use('/api/auth', (await import('./routes/authRoutes.js')).default);
    app.use('/api/chefs', (await import('./routes/chefRoutes.js')).default);
    app.use('/api/leagues', (await import('./routes/leagueRoutes.js')).default);
    app.use('/api/challenges', (await import('./routes/challengeRoutes.js')).default);
    app.use('/api/messages', (await import('./routes/messageRoutes.js')).default);

    // Welcome route
    app.get('/', (req, res) => {
      res.send('Top Chef Fantasy API is running...');
    });

    // Error handling middleware
    app.use((req, res, next) => {
      const error = new Error(`Not Found - ${req.originalUrl}`);
      res.status(404);
      next(error);
    });
    app.use((err, req, res, next) => {
      logger.error(`Server Error: ${err.message}`, { stack: err.stack });
      const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
      res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      });
    });

    // Dynamic port finding and saving to file
    const basePort = parseInt(process.env.PORT, 10) || 5000;
    portfinder.basePort = basePort;
    const port = await portfinder.getPortPromise();

    // Start the server
    server.listen(port, () => {
      logger.info(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
      // Write port to client/backend-port.json
      const portFilePath = path.resolve(__dirname, '../../client/backend-port.json');
      logger.info(`Target port file path: ${portFilePath}`);
      try {
        // Delete existing file to ensure a fresh write (optional, comment out if not needed)
        if (fs.existsSync(portFilePath)) {
          fs.unlinkSync(portFilePath);
          logger.info(`Deleted existing ${portFilePath}`);
        }
        // Write the new port
        fs.writeFileSync(portFilePath, JSON.stringify({ port }), 'utf8');
        logger.info(`Port ${port} saved to ${portFilePath}`);
        // Verify it wrote correctly
        const writtenContent = fs.readFileSync(portFilePath, 'utf8');
        logger.info(`Verified port file content: ${writtenContent}`);
      } catch (writeError) {
        logger.error(`Failed to write port file: ${writeError.message}`, { stack: writeError.stack });
      }
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${port} is in use, attempting to find another...`);
        portfinder.getPortPromise().then((newPort) => {
          server.listen(newPort, () => {
            logger.info(`Server switched to port ${newPort}`);
            // Update port file
            const portFilePath = path.resolve(__dirname, '../../client/backend-port.json');
            logger.info(`Target port file path: ${portFilePath}`);
            try {
              // Delete existing file to ensure a fresh write (optional)
              if (fs.existsSync(portFilePath)) {
                fs.unlinkSync(portFilePath);
                logger.info(`Deleted existing ${portFilePath}`);
              }
              // Write the new port
              fs.writeFileSync(portFilePath, JSON.stringify({ port: newPort }), 'utf8');
              logger.info(`Port ${newPort} saved to ${portFilePath}`);
              // Verify it wrote correctly
              const writtenContent = fs.readFileSync(portFilePath, 'utf8');
              logger.info(`Verified port file content: ${writtenContent}`);
            } catch (writeError) {
              logger.error(`Failed to write port file: ${writeError.message}`, { stack: writeError.stack });
            }
          });
        });
      } else {
        logger.error('Server error:', err);
        throw err;
      }
    });

    // Graceful shutdown
    ['SIGINT', 'SIGTERM'].forEach((signal) => {
      process.on(signal, () => gracefulShutdown(server, io, signal));
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown(server, io, 'unhandledRejection');
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown(server, io, 'uncaughtException');
    });

  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

// Start the server
startServer();