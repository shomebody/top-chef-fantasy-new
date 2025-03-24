/**
 * Firestore Database Schema
 * 
 * This is a reference document for the Firestore data structure.
 * No actual code is executed here - this serves as documentation.
 */

/**
 * Collection: users
 * Document ID: UID from Firebase Auth
 * {
 *   name: string,
 *   email: string, 
 *   avatar: string,
 *   isAdmin: boolean,
 *   leagues: Array<string> (league IDs),
 *   createdAt: timestamp
 * }
 */

/**
 * Collection: chefs
 * Document ID: auto-generated
 * {
 *   name: string,
 *   bio: string,
 *   hometown: string,
 *   specialty: string,
 *   image: string,
 *   status: 'active' | 'eliminated' | 'winner',
 *   eliminationWeek: number | null,
 *   stats: {
 *     wins: number,
 *     eliminations: number,
 *     quickfireWins: number,
 *     challengeWins: number,
 *     totalPoints: number
 *   },
 *   weeklyPerformance: [
 *     {
 *       week: number,
 *       points: number,
 *       rank: number,
 *       highlights: string
 *     }
 *   ]
 * }
 */

/**
 * Collection: leagues
 * Document ID: auto-generated
 * {
 *   name: string,
 *   creator: string (user ID),
 *   season: number,
 *   maxMembers: number,
 *   maxRosterSize: number,
 *   status: 'draft' | 'active' | 'completed',
 *   inviteCode: string,
 *   scoringSettings: {
 *     quickfireWin: number,
 *     challengeWin: number,
 *     topThree: number,
 *     bottomThree: number,
 *     elimination: number,
 *     finalWinner: number
 *   },
 *   currentWeek: number,
 *   createdAt: timestamp
 * }
 * 
 * Subcollection: leagues/{leagueId}/members
 * Document ID: user ID
 * {
 *   role: 'owner' | 'admin' | 'member',
 *   score: number,
 *   joinedAt: timestamp
 * }
 * 
 * Subcollection: leagues/{leagueId}/members/{userId}/roster
 * Document ID: chef ID
 * {
 *   drafted: timestamp,
 *   active: boolean
 * }
 * 
 * Subcollection: leagues/{leagueId}/draftOrder
 * Document ID: auto-generated
 * {
 *   user: string (user ID),
 *   position: number
 * }
 */

/**
 * Collection: messages
 * Document ID: auto-generated
 * {
 *   league: string (league ID),
 *   sender: string (user ID),
 *   content: string,
 *   type: 'text' | 'image' | 'system',
 *   reactions: {
 *     likes: Array<string> (user IDs),
 *     hearts: Array<string> (user IDs)
 *   },
 *   readBy: Array<string> (user IDs),
 *   createdAt: timestamp
 * }
 */

/**
 * Collection: challenges
 * Document ID: auto-generated
 * {
 *   season: number,
 *   week: number,
 *   title: string,
 *   description: string,
 *   location: string,
 *   isQuickfire: boolean,
 *   guest: string,
 *   winner: string (chef ID) | null,
 *   topChefs: Array<string> (chef IDs),
 *   bottomChefs: Array<string> (chef IDs),
 *   eliminatedChef: string (chef ID) | null,
 *   airDate: timestamp,
 *   status: 'upcoming' | 'completed'
 * }
 */

// Export nothing - this is just for documentation
export {};