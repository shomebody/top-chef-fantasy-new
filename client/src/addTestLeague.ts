// client/src/addTestLeague.ts
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './config/firebase';

async function addTestLeague() {
  try {
    const leagueRef = await addDoc(collection(db, 'leagues'), {
      name: 'Test League',
      creator: '4sJU4dr0kEaNC0am3mWWThhQtnd2',
      season: 20,
      maxMembers: 10,
      maxRosterSize: 5,
      status: 'draft',
      inviteCode: 'TEST123',
      scoringSettings: {
        quickfireWin: 10,
        challengeWin: 20,
        topThree: 5,
        bottomThree: -5,
        elimination: -15,
        finalWinner: 50
      },
      currentWeek: 1,
      members: [
        {
          user: {
            _id: '4sJU4dr0kEaNC0am3mWWThhQtnd2',
            name: 'test567',
            email: 'test567@test567.com',
            avatar: ''
          },
          role: 'owner',
          score: 0,
          roster: [],
          joinedAt: new Date().toISOString()
        }
      ],
      createdAt: serverTimestamp()
    });
    console.log('Test league added with ID:', leagueRef.id);
  } catch (err) {
    console.error('Error adding test league:', (err as Error).message || err);
  }
}

addTestLeague().then(() => process.exit(0)).catch(() => process.exit(1));