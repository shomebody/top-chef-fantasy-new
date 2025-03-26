import { useEffect, useState, FormEvent } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useLeague, UseLeagueReturn } from '../hooks/useLeague';
import { useChat, UseChatReturn } from '../hooks/useChat';
import { useAuth, UserProfile } from '../hooks/useAuth';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

// Enhanced League type from league.d.ts
interface League {
  _id: string;
  name: string;
  season: number;
  status: 'draft' | 'active' | 'completed';
  currentWeek: number;
  maxMembers: number;
  maxRosterSize: number;
  members: { user: { _id: string; name: string }; role: 'owner' | 'admin' | 'member'; score: number }[];
  inviteCode?: string; // Added
  scoringSettings?: {
    challengeWin: number;
    quickfireWin: number;
    topThree: number;
    bottomThree: number;
  }; // Added
}

const LeagueDetail = () => {
  const { id } = useParams<{ id: string }>();
  const {
    leagues = [],
    currentLeague = null,
    leaderboard = [],
    loading = false,
    error = null,
    fetchLeagueDetails = () => Promise.resolve(undefined),
    switchLeague = () => {},
  }: UseLeagueReturn = useLeague();
  const { user = null }: { user: UserProfile | null } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings' | 'chat'>('overview');
  const [chatInput, setChatInput] = useState<string>('');
  const [chatError, setChatError] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');

  const { messages = [], sendMessage = () => Promise.resolve(), typingUsers = [] }: UseChatReturn = useChat(id);

  useEffect(() => {
    if (id) {
      if (!currentLeague || currentLeague._id !== id) {
        switchLeague(id);
      }
      fetchLeagueDetails(id).catch((err: Error) => {
        console.error('Fetch league details failed:', err);
        setLocalError('Failed to load league details. Please try again.');
      });
    }
  }, [id, currentLeague, fetchLeagueDetails, switchLeague]);

  const leagueExists = leagues.some((league) => league._id === id);

  if (!leagueExists && !loading) {
    return <Navigate to="/leagues" />;
  }

  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (chatInput.trim() && id) {
      try {
        await sendMessage(chatInput.trim());
        setChatInput('');
        setChatError('');
      } catch (err) {
        console.error('Chat send error:', err);
        setChatError('Failed to send message. Please try again.');
      }
    }
  };

  const isLeagueAdmin = currentLeague?.members?.some(
    (member) => member.user._id === user?._id && (member.role === 'owner' || member.role === 'admin')
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg
          className="animate-spin h-10 w-10 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (error || localError) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg m-6">
        {error || localError}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentLeague?.name || 'League'}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Season {currentLeague?.season || ''} • {currentLeague?.members?.length || 0} Members
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (currentLeague?.inviteCode) {
                  navigator.clipboard
                    .writeText(currentLeague.inviteCode)
                    .then(() => alert('Invite code copied!'))
                    .catch((err) => console.error('Failed to copy:', err));
                }
              }}
            >
              Copy Invite Code
            </Button>
            {isLeagueAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (currentLeague?.status === 'draft') {
                    console.log('Starting draft...');
                  } else {
                    setActiveTab('settings');
                  }
                }}
              >
                {currentLeague?.status === 'draft' ? 'Start Draft' : 'Manage League'}
              </Button>
            )}
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
            {currentLeague?.status || 'Unknown'} • Week {currentLeague?.currentWeek || 'N/A'}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {(['overview', 'members', 'settings', 'chat'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="League Status">
                  <div className="text-3xl font-bold mb-2 capitalize">{currentLeague?.status || 'Unknown'}</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentLeague?.status === 'draft'
                      ? 'Draft in progress'
                      : `Week ${currentLeague?.currentWeek || '?'} of competition`}
                  </p>
                </Card>
                <Card title="Scoring System">
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
                <Card title="Invite Code">
                  <div className="bg-gray-100 dark:bg-gray-700 py-2 px-4 rounded-lg font-mono text-lg mb-2">
                    {currentLeague?.inviteCode || 'N/A'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (currentLeague?.inviteCode) {
                        navigator.clipboard
                          .writeText(currentLeague.inviteCode)
                          .then(() => alert('Invite code copied!'))
                          .catch((err) => console.error('Failed to copy:', err));
                      }
                    }}
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
                      {leaderboard.length > 0 ? (
                        leaderboard.map((entry, index) => (
                          <tr key={entry.user._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {entry.user.name || 'Unknown'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {entry.score || 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {entry.rosterCount || 0} / {currentLeague?.maxRosterSize || 'N/A'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
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

          {activeTab === 'members' && (
            <div className="space-y-6">
              {currentLeague?.members && currentLeague.members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentLeague.members.map((member) => (
                    <Card key={member.user._id || Math.random().toString()}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-medium">
                          {member.user.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{member.user.name || 'Unknown'}</h3>
                          <div className="flex items-center space-x-2 text-sm">
                            <span
                              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                member.role === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {member.role || 'member'}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">Score: {member.score || 0}</span>
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

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card title="League Settings">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Only league owners and admins can modify league settings.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    console.log('Settings form submitted');
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        League Name
                      </label>
                      <input
                        type="text"
                        defaultValue={currentLeague?.name || ''}
                        readOnly={!isLeagueAdmin}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Season
                      </label>
                      <input
                        type="number"
                        defaultValue={currentLeague?.season || ''}
                        readOnly={!isLeagueAdmin}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Members
                      </label>
                      <input
                        type="number"
                        defaultValue={currentLeague?.maxMembers || ''}
                        readOnly={!isLeagueAdmin}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Roster Size
                      </label>
                      <input
                        type="number"
                        defaultValue={currentLeague?.maxRosterSize || ''}
                        readOnly={!isLeagueAdmin}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="primary" className="mt-6" disabled={!isLeagueAdmin}>
                    Update Settings
                  </Button>
                </form>
              </Card>
              <Card title="Danger Zone" className="border border-red-300 dark:border-red-700">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  These actions cannot be undone. Please be certain.
                </p>
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to leave this league?')) {
                      console.log('User confirmed leaving league');
                    }
                  }}
                >
                  Leave League
                </Button>
              </Card>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
              {chatError && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg">
                  {chatError}
                </div>
              )}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto flex flex-col space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div key={message._id || Math.random().toString()} className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {message.sender?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ''}
                        </div>
                      </div>
                      <div className="pl-6 text-gray-700 dark:text-gray-300">{message.content || ''}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                )}
                {typingUsers.length > 0 && (
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    {typingUsers.length === 1
                      ? `${typingUsers[0].username || 'Someone'} is typing...`
                      : `${typingUsers.length} people are typing...`}
                  </div>
                )}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <Button type="submit" variant="primary" disabled={!chatInput.trim()}>
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