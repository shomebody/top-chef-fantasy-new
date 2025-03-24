import api from './api.js';

const MessageService = {
  // Get messages for a league
  getLeagueMessages: async (leagueId, limit = 50, before = null) => {
    let params = { limit };
    if (before) {
      params.before = before;
    }
    
    return await api.get(/messages/, { params });
  }
  
  // Send a message
  sendMessage: async (leagueId, content, type = 'text') => {
    return await api.post('/messages', { leagueId, content, type });
  }
  
  // Add reaction to a message
  addReaction: async (messageId, reaction) => {
    return await api.post(/messages//reaction, { reaction });
  }
  
  // Get unread message count
  getUnreadCount: async (leagueId) => {
    return await api.get(/messages/unread/);
  }
};

export default MessageService;
