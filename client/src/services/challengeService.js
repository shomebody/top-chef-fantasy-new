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