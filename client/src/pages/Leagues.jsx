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
  }, [fetchUserLeagues]);

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