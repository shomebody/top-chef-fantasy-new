// client/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLeague } from '../hooks/useLeague';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FirebaseAuthTest from '../components/FirebaseAuthTest';

// Define types for our component
interface LeaderboardEntry {
  user: {
    _id: string;
    name: string;
  };
  score: number;
  rosterCount: number;
}

const Dashboard: React.FC = () => {
  const { currentLeague, leaderboard, loading, error, fetchLeagueDetails } = useLeague();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  useEffect(() => {
    if (currentLeague?._id) {
      fetchLeagueDetails(currentLeague._id)
        .catch(error => {
          console.error('Error fetching league details:', error);
        });
    }
  }, [currentLeague?._id, fetchLeagueDetails]);
  
  const handleRefresh = async () => {
    if (!currentLeague?._id) return;
    
    try {
      setRefreshing(true);
      await fetchLeagueDetails(currentLeague._id);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <svg 
          className="animate-spin h-10 w-10 text-primary-600" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-label="Loading"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          ></circle>
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }
  
  // No leagues state
  if (!currentLeague) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="text-4xl font-display text-primary-600 mb-4">Welcome, {user?.name || 'Chef'}!</div>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          You're not part of any leagues yet. Create a new league or join an existing one to get started!
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/leagues">
            <Button variant="primary" size="lg">Browse Leagues</Button>
          </Link>
          <Link to="/settings">
            <Button variant="outline" size="lg">Profile Settings</Button>
          </Link>
        </div>
        
        {/* Firebase Authentication Test Card */}
        <div className="mt-8 w-full max-w-md">
          <Card title="Firebase Authentication">
            <FirebaseAuthTest />
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            isLoading={refreshing}
          >
            Refresh
          </Button>
          <Link to={`/leagues/${currentLeague._id}`}>
            <Button variant="primary" size="sm">League Details</Button>
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {/* Firebase Authentication Test Card */}
      <Card title="Firebase Authentication">
        <FirebaseAuthTest />
      </Card>
      
      {/* League Overview */}
      <Card 
        title={currentLeague.name} 
        subtitle={`Season ${currentLeague.season}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">League Status</div>
            <div className="text-xl font-semibold mt-1 capitalize">{currentLeague.status}</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Week</div>
            <div className="text-xl font-semibold mt-1">Week {currentLeague.currentWeek}</div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Members</div>
            <div className="text-xl font-semibold mt-1">
              {currentLeague.members?.length || 0} / {currentLeague.maxMembers}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Leaderboard */}
      <Card title="Leaderboard" subtitle="Current standings">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Player</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roster Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((entry: LeaderboardEntry, index: number) => (
                  <tr key={entry.user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {entry.user.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {entry.score}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {entry.rosterCount} / {currentLeague.maxRosterSize}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    No leaderboard data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Quick Actions">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Manage your fantasy experience with these quick actions
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/chefs">
                <Button variant="secondary" size="sm">View Chefs</Button>
              </Link>
              <Link to="/schedule">
                <Button variant="secondary" size="sm">View Schedule</Button>
              </Link>
              <Link to={`/leagues/${currentLeague._id}/roster`}>
                <Button variant="outline" size="sm">Manage Roster</Button>
              </Link>
            </div>
          </div>
        </Card>
        
        <Card title="Current Challenge" subtitle={`Week ${currentLeague.currentWeek}`}>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Make your picks for this week's challenge before it airs!
            </p>
            <Link to="/schedule">
              <Button variant="primary" size="sm">Make Predictions</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;