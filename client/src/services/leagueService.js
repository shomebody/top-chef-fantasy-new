import api from './api.js';

const LeagueService = {
  // Get all leagues for current user
  getUserLeagues: async () => {
    return await api.get('/leagues');
  }
  
  // Get a single league by ID
  getLeagueById: async (id) => {
    return await api.get(/leagues/);
  }
  
  // Create a new league
  createLeague: async (leagueData) => {
    return await api.post('/leagues', leagueData);
  }
  
  // Join a league with invite code
  joinLeague: async (inviteCode) => {
    return await api.post('/leagues/join', { inviteCode });
  }
  
  // Get league leaderboard
  getLeaderboard: async (leagueId) => {
    return await api.get(/leagues//leaderboard);
  }
  
  // Update league settings
  updateLeague: async (leagueId, leagueData) => {
    return await api.put(/leagues/, leagueData);
  }
  
  // Draft a chef
  draftChef: async (leagueId, chefId) => {
    return await api.post(/leagues//draft, { chefId });
  }
  
  // Update draft order
  updateDraftOrder: async (leagueId, draftOrder) => {
    return await api.put(/leagues//draft-order, { draftOrder });
  }
};

export default LeagueService;
