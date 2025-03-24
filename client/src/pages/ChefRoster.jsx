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
  }, [currentLeague?._id, fetchLeagueDetails]);
  
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
                    <span className="text-xs font-medium px-2 py-1 rounded-full">
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