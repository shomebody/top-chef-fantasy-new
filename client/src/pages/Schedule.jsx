import React, { useEffect, useState } from 'react';
import { useLeague } from '../hooks/useLeague.jsx';
import Card from '../components/ui/Card.jsx';

const Schedule = () => {
  const { challenges, currentLeague, loading, error, fetchLeagueDetails } = useLeague();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  
  useEffect(() => {
    if (currentLeague?._id) {
      fetchLeagueDetails(currentLeague._id);
    }
  }, [currentLeague?._id, fetchLeagueDetails]);
  
  const handleSelectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
  };
  
  const closeDetails = () => {
    setSelectedChallenge(null);
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Challenge Schedule</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {!currentLeague ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No league selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a league to view challenge schedule.
          </p>
        </div>
      ) : challenges && challenges.length > 0 ? (
        <div className="space-y-6">
          <Card title="Current Week: Week">
            <div className="space-y-4">
              {challenges
                .filter(challenge => challenge.week === currentLeague.currentWeek)
                .map(challenge => (
                  <div
                    key={challenge._id}
                    className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSelectChallenge(challenge)}
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{challenge.title}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full">
                            {challenge.isQuickfire ? 'Quickfire' : 'Elimination'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {challenge.location} • {new Date(challenge.airDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded-full">
                          {challenge.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
          
          <Card title="Season Schedule">
            <div className="space-y-6">
              {Array.from(new Set(challenges.map(c => c.week))).sort((a, b) => a - b).map(week => (
                <div key={week} className="space-y-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">Week {week}</h3>
                  <div className="space-y-2 ml-4">
                    {challenges
                      .filter(challenge => challenge.week === week)
                      .map(challenge => (
                        <div
                          key={challenge._id}
                          className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          onClick={() => handleSelectChallenge(challenge)}
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{challenge.title}</h4>
                                <span className="text-xs px-2 py-0.5 rounded-full">
                                  {challenge.isQuickfire ? 'Quickfire' : 'Elimination'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {challenge.location} • {new Date(challenge.airDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs px-2 py-0.5 rounded-full">
                                {challenge.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No challenges available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There are no challenges scheduled for this league yet.
          </p>
        </div>
      )}
      
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedChallenge.title}</h2>
                <button
                  onClick={closeDetails}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full">
                  {selectedChallenge.isQuickfire ? 'Quickfire' : 'Elimination'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full">
                  {selectedChallenge.status}
                </span>
              </div>
              
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-2">Challenge Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Location</span>
                      <p className="font-medium">{selectedChallenge.location}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Air Date</span>
                      <p className="font-medium">{new Date(selectedChallenge.airDate).toLocaleDateString()}</p>
                    </div>
                    {selectedChallenge.guest && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Guest Judge</span>
                        <p className="font-medium">{selectedChallenge.guest}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300">{selectedChallenge.description}</p>
                </div>
                
                {selectedChallenge.status === 'completed' && (
                  <div>
                    <h3 className="font-medium text-lg mb-2">Results</h3>
                    {selectedChallenge.winner && (
                      <div className="mb-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Winner</span>
                        <p className="font-medium">{selectedChallenge.winner.name}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedChallenge.topChefs && selectedChallenge.topChefs.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Top Performers</span>
                          <ul className="mt-1 space-y-1">
                            {selectedChallenge.topChefs.map(chef => (
                              <li key={chef._id} className="text-gray-700 dark:text-gray-300">
                                {chef.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedChallenge.bottomChefs && selectedChallenge.bottomChefs.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Bottom Performers</span>
                          <ul className="mt-1 space-y-1">
                            {selectedChallenge.bottomChefs.map(chef => (
                              <li key={chef._id} className="text-gray-700 dark:text-gray-300">
                                {chef.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {selectedChallenge.eliminatedChef && (
                      <div className="mt-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Eliminated</span>
                        <p className="font-medium text-red-600 dark:text-red-400">
                          {selectedChallenge.eliminatedChef.name}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;