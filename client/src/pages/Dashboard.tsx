// client/src/pages/Dashboard.tsx
import { useEffect } from 'react';
import { useLeague } from '../hooks/useLeague';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  console.log('Dashboard render started');
  
  const { currentLeague, loading, error, fetchLeagueDetails, createLeague, joinLeagueWithCode } = useLeague();
  const { user } = useAuth();

  useEffect(() => {
    if (currentLeague?._id && !loading && !error) {
      console.log('Fetching league details for:', currentLeague._id);
      fetchLeagueDetails(currentLeague._id).catch(err => {
        console.error('Error fetching league details:', err);
      });
    }
  }, [currentLeague?._id, fetchLeagueDetails, loading, error]);

  const handleCreateLeague = async () => {
    try {
      await createLeague({ name: 'Test League' });
    } catch (err) {
      console.error('Error creating league:', err);
    }
  };

  const handleJoinLeague = async () => {
    try {
      await joinLeagueWithCode('TESTCODE');
    } catch (err) {
      console.error('Error joining league:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  if (!currentLeague) {
    return (
      <div>
        <h1>Welcome, {user?.name || 'User'}!</h1>
        <p>No leagues yet. Create or join one:</p>
        <button onClick={handleCreateLeague}>Create League</button>
        <button onClick={handleJoinLeague}>Join League (TESTCODE)</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>League: {currentLeague.name}</p>
      <p>Status: {currentLeague.status}</p>
      <p>Members: {currentLeague.members?.length || 0}</p>
    </div>
  );
};

export default Dashboard;