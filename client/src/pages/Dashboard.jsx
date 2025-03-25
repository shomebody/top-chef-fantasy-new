import { useEffect } from 'react';
import { useLeague } from '../hooks/useLeague.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { Link } from 'react-router-dom';


const Dashboard = () => {
  const { currentLeague, leaderboard, loading, error, fetchLeagueDetails } = useLeague();
  
  useEffect(() => {
    if (currentLeague?._id) {
      fetchLeagueDetails(currentLeague._id);
    }
  }, [currentLeague?._id, fetchLeagueDetails]);
  
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
  
  if (!currentLeague) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-4xl font-display text-primary-600 mb-4">Welcome!</div>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          It looks like you're not part of any leagues yet. Create or join a league to get started!
        </p>
        <div className="flex space-x-4">
          <Link to="/leagues">
            <Button variant="primary">Browse Leagues</Button>
          </Link>
        </div>
        
        {/* Firebase Connection Test */}
        <div className="mt-8 w-full max-w-md">
          <FirebaseTest />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Link to="/leagues">
          <Button variant="outline" size="sm">League Details</Button>
        </Link>
      </div>
      
      {/* Firebase Connection Test */}
      <Card title="Firebase Connection">
        <FirebaseTest />
      </Card>
      
      {/* League Overview */}
      <Card title={currentLeague?.name} subtitle="Season">
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
                leaderboard.map((entry, index) => (
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
                  <td colSpan="4" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
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
              <Button variant="outline" size="sm">Manage Roster</Button>
            </div>
          </div>
        </Card>
        
        <Card title="Current Challenge" subtitle="Week">
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Make your picks for this week's challenge before it airs!
            </p>
            <Button variant="primary" size="sm">Make Predictions</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;