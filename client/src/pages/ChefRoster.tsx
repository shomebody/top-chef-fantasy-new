import { useState, useEffect, memo } from 'react';
import { useChef } from '../hooks/useChef';
import { useLeague } from '../hooks/useLeague';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useSocket, EVENTS } from '../context/SocketContext';

interface ChefData {
  _id: string;
  name: string;
  bio: string;
  hometown: string;
  specialty: string;
  image: string;
  status: 'active' | 'eliminated' | 'winner';
  eliminationWeek: number | null;
  stats: {
    wins: number;
    eliminations: number;
    quickfireWins: number;
    challengeWins: number;
    totalPoints: number;
  };
  weeklyPerformance: Array<{
    week: number;
    points: number;
    rank: number;
    highlights: string;
  }>;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <svg
      className="animate-spin h-10 w-10 text-primary-600"
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

const ChefCard = memo(
  ({ chef, onClick, imageUrl }: { chef: ChefData; onClick: () => void; imageUrl: string | null | undefined }) => {
    console.log(`Rendering ChefCard for ${chef.name}, imageUrl: ${imageUrl}`);
    return (
      <Card className="cursor-pointer card-hover" onClick={onClick}>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={chef.name}
                className="w-full h-full object-cover rounded-full"
                width={64}
                height={64}
              />
            ) : (
              <span className="text-2xl text-gray-600 dark:text-gray-400">{chef.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{chef.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{chef.specialty}</p>
            <div className="mt-2 flex items-center">
              <span className="text-xs font-medium px-2 py-1 rounded-full">{chef.status}</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">{chef.stats.totalPoints} pts</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }
);
ChefCard.displayName = 'ChefCard'; // Add this
function ChefRoster() {
  const { chefs: contextChefs, loading, error } = useChef();
  const { currentLeague } = useLeague();
  const { socket, connected } = useSocket();
  const [localChefs, setLocalChefs] = useState<ChefData[]>([]);
  const [selectedChef, setSelectedChef] = useState<ChefData | null>(null);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string | null }>({});

  // Sync localChefs with contextChefs when contextChefs changes
  useEffect(() => {
    if (contextChefs) {
      console.log('Syncing localChefs with contextChefs', contextChefs.length);
      setLocalChefs(contextChefs);
    }
  }, [contextChefs]);

  console.log('ChefRoster render', { loading, error, chefsLength: localChefs.length, socketConnected: connected });

  const handleSelectChef = (chef: ChefData) => {
    console.log(`Selected chef: ${chef.name}`);
    setSelectedChef(chef);
  };

  const closeChefDetails = () => {
    console.log('Closing chef details');
    setSelectedChef(null);
  };

  // Fetch image URLs for all chefs
  useEffect(() => {
    if (localChefs.length > 0) {
      console.log('Fetching images for chefs', localChefs.map((c) => c.name));
      const fetchImages = async () => {
        const imagePromises = localChefs.map(async (chef) => {
          if (chef.image && imageUrls[chef._id] === undefined) {
            try {
              console.log(`Fetching image for ${chef.name}`);
              const imageRef = ref(storage, chef.image);
              const url = await getDownloadURL(imageRef);
              setImageUrls((prev) => ({ ...prev, [chef._id]: url }));
              console.log(`Successfully fetched image URL for ${chef.name}: ${url}`);
            } catch (err) {
              console.error(`Error fetching image for ${chef.name}:`, err);
              setImageUrls((prev) => ({ ...prev, [chef._id]: null }));
            }
          } else {
            console.log(`Skipping image fetch for ${chef.name}, already fetched or no image`);
          }
        });
        await Promise.all(imagePromises);
        console.log('All image fetches completed');
      };
      fetchImages();
    }
  }, [localChefs, imageUrls]);

  // Handle real-time chef updates via socket
  useEffect(() => {
    if (socket && connected) {
      console.log('Setting up socket listener for chef updates');
      socket.on(EVENTS.CHEF_UPDATE, (updatedChef: ChefData) => {
        console.log('Received chef update via socket:', updatedChef);
        setLocalChefs((prevChefs) =>
          prevChefs.map((chef) => (chef._id === updatedChef._id ? { ...chef, ...updatedChef } : chef))
        );
        if (selectedChef?._id === updatedChef._id) {
          setSelectedChef((prev) => (prev ? { ...prev, ...updatedChef } : prev));
        }
      });
    }
    return () => {
      if (socket) {
        console.log('Cleaning up socket listener for chef updates');
        socket.off(EVENTS.CHEF_UPDATE);
      }
    };
  }, [socket, connected, selectedChef]);

  if (loading) {
    console.log('Rendering loading state');
    return <LoadingSpinner />;
  }

  if (!contextChefs) {
    console.log('No chefs data available');
    return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Error: No chef data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chef Roster</h1>
        {currentLeague && currentLeague.status === 'draft' && (
          <Button variant="primary" size="sm">
            <span>
              Draft Chef
              {currentLeague && <span className="ml-2 text-xs text-gray-500">({currentLeague.name})</span>}
            </span>
          </Button>
        )}
      </div>
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">{error}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {localChefs.length > 0 ? (
          localChefs.map((chef) => (
            <ChefCard
              key={chef._id}
              chef={chef}
              onClick={() => handleSelectChef(chef)}
              imageUrl={imageUrls[chef._id]}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">No chefs available.</div>
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
                  type="button"
                  aria-label="Close chef details"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-6 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="w-full sm:w-1/3">
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                      {imageUrls[selectedChef._id] ? (
                        <img
                          src={imageUrls[selectedChef._id]!}
                          alt={selectedChef.name}
                          className="w-full h-full object-cover rounded-lg"
                          width={300}
                          height={300}
                        />
                      ) : (
                        <span className="text-6xl text-gray-600 dark:text-gray-400">{selectedChef.name.charAt(0)}</span>
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Week
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Points
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Rank
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Highlights
                            </th>
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
                              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{week.highlights}</td>
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
}

export default ChefRoster;