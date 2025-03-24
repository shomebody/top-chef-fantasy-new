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
      if (!user) {
        return next(new Error('Authentication error: Invalid token'));
      }
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.stack); // Detailed logging
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connections
  io.on(EVENTS.CONNECTION, (socket) => {
    console.log(`User connected: ${socket.user.id}`);

    // Join user's leagues
    socket.on(EVENTS.JOIN_LEAGUE, ({ leagueId }) => {
      try {
        socket.join(`league:${leagueId}`);
        console.log(`User ${socket.user.id} joined league: ${leagueId}`);
        socket.to(`league:${leagueId}`).emit(EVENTS.USER_JOINED, {
          userId: socket.user.id,
          username: socket.user.name,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error in JOIN_LEAGUE:', error.stack);
      }
    });

    // Leave a league
    socket.on(EVENTS.LEAVE_LEAGUE, ({ leagueId }) => {
      try {
        socket.leave(`league:${leagueId}`);
        console.log(`User ${socket.user.id} left league: ${leagueId}`);
        socket.to(`league:${leagueId}`).emit(EVENTS.USER_LEFT, {
          userId: socket.user.id,
          username: socket.user.name,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error in LEAVE_LEAGUE:', error.stack);
      }
    });

    // Handle chat messages
    socket.on(EVENTS.SEND_MESSAGE, (message) => {
      try {
        const enhancedMessage = {
          ...message,
          userId: socket.user.id,
          username: socket.user.name,
          timestamp: new Date()
        };
        io.to(`league:${message.leagueId}`).emit(EVENTS.CHAT_MESSAGE, enhancedMessage);
      } catch (error) {
        console.error('Error in SEND_MESSAGE:', error.stack);
      }
    });

    // Handle user typing
    socket.on(EVENTS.USER_TYPING, ({ leagueId }) => {
      try {
        socket.to(`league:${leagueId}`).emit(EVENTS.USER_TYPING, {
          userId: socket.user.id,
          username: socket.user.name
        });
      } catch (error) {
        console.error('Error in USER_TYPING:', error.stack);
      }
    });

    // Handle disconnection
    socket.on(EVENTS.DISCONNECT, () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });
};

export default setupSocket;