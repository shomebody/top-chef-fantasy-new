const { initializeApp } = require('firebase/app');
const { getFirestore, addDoc, collection } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBMRB7BL9RWOAuLgVsN9kl34fc-geBbWXY",
  authDomain: "top-chef-fantasy.firebaseapp.com",
  projectId: "top-chef-fantasy",
  storageBucket: "top-chef-fantasy.firebasestorage.app",
  messagingSenderId: "510674256652",
  appId: "1:510674256652:web:8c8012cdb6a32769bebf29",
  measurementId: "G-SVTWWGL9S9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTestLeague() {
  try {
    const data = {
      name: 'Test League 3', // New name to avoid dupes
      members: [{
        user: { 
          _id: '4sJU4dr0kEaNC0am3mWWThhQtnd2', 
          name: 'test567', 
          email: 'test567@test567.com' 
        },
        role: 'owner',
        score: 0,
        roster: [],
        joinedAt: new Date()
      }],
      createdAt: new Date()
    };
    console.log('Payload:', JSON.stringify(data, null, 2));
    const leagueRef = await addDoc(collection(db, 'leagues'), data);
    console.log('Test league added with ID:', leagueRef.id);
  } catch (err) {
    console.error('Error adding test league:', err.message || err);
  }
}

addTestLeague();