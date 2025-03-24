import api from './api.js';

const ChefService = {
  // Get all chefs
  getAllChefs: async () => {
    return await api.get('/chefs');
  }
  
  // Get a chef by ID
  getChefById: async (id) => {
    return await api.get(/chefs/);
  }
  
  // Get chef stats
  getChefStats: async (id) => {
    return await api.get(/chefs//stats);
  }
};

export default ChefService;
