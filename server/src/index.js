import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose'; // Explicitly import mongoose

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import chefRoutes from './routes/chefRoutes.js';
import leagueRoutes from './routes/leagueRoutes.js';
import challengeRoutes from './routes/challengeRoutes.js';
import setupSocket from './socket/index.js';

// Load environment variables
dotenv.config();

// Start server only after MongoDB connects
const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected successfully');

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
      }
    });

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
    app.use((err, req, res, next) => {
      console.error('Server Error:', err.stack); // Detailed error logging
      const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
      res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
      });
    });

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.log('UNHANDLED REJECTION! Shutting down...');
      console.log(err.name, err.message);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();