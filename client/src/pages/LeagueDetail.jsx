import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useLeague } from '../hooks/useLeague.jsx';
import { useChat } from '../hooks/useChat.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';

const LeagueDetail = () => {
  const { id } = useParams();
  const { leagues, currentLeague, leaderboard, loading, error, fetchLeagueDetails, switchLeague } = useLeague();
  const [activeTab, setActiveTab] = useState('overview');
  const { messages, sendMessage } = useChat(id);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    if (id) {
      if (!currentLeague || currentLeague._id !== id) {
        switchLeague(id);
      }
      fetchLeagueDetails(id).catch((err) => console.error('Fetch league details failed:', err));
    }
  }, [id, currentLeague, fetchLeagueDetails, switchLeague]);

  const leagueExists = leagues.some((league) => league._id === id);

  if (!leagueExists && !loading) {
    return <Navigate to="/leagues" />;
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (chatInput.trim() && id) {
      try {
        await sendMessage(chatInput.trim());
        setChatInput('');
        setChatError('');
      } catch (err) {
        console.error('Chat send error:', err);
        setChatError('Failed to send message');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg
          className="animate-spin h-10 w-10 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg m-6">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* League Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentLeague?.name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Season {currentLeague?.season} • {currentLeague?.members?.length || 0} Members
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" aria-label="Invite members">
              Invite
            </Button>
            <Button variant="primary" size="sm" aria-label="Manage league">
              {currentLeague?.status === 'draft' ? 'Start Draft' : 'Manage League'}
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <span
            className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
              currentLeague?.status === 'draft'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {currentLeague?.status} • Week {currentLeague?.currentWeek || 'N/A'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {['overview', 'members', 'settings', 'chat'].map((tab) => (
            <button
              key={tab}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab(tab)}
              aria-label={`Switch to ${tab} tab`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="League Status" className="text-center">
                  <div className="text-3xl font-bold mb-2 capitalize">{currentLeague?.status}</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentLeague?.status === 'draft'
                      ? 'Draft in progress'
                      : `Week ${currentLeague?.currentWeek} of competition`}
                  </p>
                </Card>
                <Card title="Scoring System" className="text-center">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Challenge Win</span>
                      <span className="font-medium">{currentLeague?.scoringSettings?.challengeWin || 20} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quickfire Win</span>
                      <span className="font-medium">{currentLeague?.scoringSettings?.quickfireWin || 10} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Top Three</span>
                      <span className="font-medium">{currentLeague?.scoringSettings?.topThree || 5} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bottom Three</span>
                      <span className="font-medium">{currentLeague?.scoringSettings?.bottomThree || -5} pts</span>
                    </div>
                  </div>
                </Card>
                <Card title="Invite Code" className="text-center">
                  <div className="bg-gray-100 dark:bg-gray-700 py-2 px-4 rounded-lg font-mono text-lg mb-2">
                    {currentLeague?.inviteCode || 'N/A'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(currentLeague?.inviteCode || '')}
                    aria-label="Copy invite code to clipboard"
                  >
                    Copy to Clipboard
                  </Button>
                </Card>
              </div>
              <Card title="Leaderboard">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Roster Size
                        </th>
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
                              {entry.rosterCount} / {currentLeague?.maxRosterSize || 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                          >
                            No leaderboard data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {currentLeague?.members && currentLeague.members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentLeague.members.map((member) => (
                    <Card key={member.user._id}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-medium">
                          {member.user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{member.user.name}</h3>
                          <div className="flex items-center space-x-2 text-sm">
                            <span
                              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                member.role === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {member.role}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">Score: {member.score}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No members in this league yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card title="League Settings">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Only league owners and admins can modify league settings.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      League Name
                    </label>
                    <input
                      type="text"
                      value={currentLeague?.name || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Season
                    </label>
                    <input
                      type="number"
                      value={currentLeague?.season || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Members
                    </label>
                    <input
                      type="number"
                      value={currentLeague?.maxMembers || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Roster Size
                    </label>
                    <input
                      type="number"
                      value={currentLeague?.maxRosterSize || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    />
                  </div>
                </div>
                <Button variant="primary" className="mt-6" disabled aria-label="Update league settings">
                  Update Settings
                </Button>
              </Card>
              <Card title="Danger Zone" className="border border-red-300 dark:border-red-700">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  These actions cannot be undone. Please be certain.
                </p>
                <Button variant="danger" disabled aria-label="Leave league">
                  Leave League
                </Button>
              </Card>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-6">
              {chatError && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg">
                  {chatError}
                </div>
              )}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto flex flex-col space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message._id} className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {message.sender?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="pl-6 text-gray-700 dark:text-gray-300">{message.content}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <label htmlFor="chatInput" className="sr-only">
                  Chat message
                </label>
                <input
                  id="chatInput"
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!chatInput.trim()}
                  aria-label="Send chat message"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeagueDetail;