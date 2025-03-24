import mongoose from 'mongoose';

const leagueSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide a league name'], trim: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
    roster: [{
      chef: { type: mongoose.Schema.Types.ObjectId, ref: 'Chef' },
      drafted: { type: Date, default: Date.now },
      active: { type: Boolean, default: true }
    }],
    score: { type: Number, default: 0 }
  }],
  season: { type: Number, required: [true, 'Please provide a season number'] },
  maxMembers: { type: Number, default: 10 },
  maxRosterSize: { type: Number, default: 5 },
  status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
  inviteCode: { type: String, required: true, unique: true },
  scoringSettings: {
    quickfireWin: { type: Number, default: 10 },
    challengeWin: { type: Number, default: 20 },
    topThree: { type: Number, default: 5 },
    bottomThree: { type: Number, default: -5 },
    elimination: { type: Number, default: -15 },
    finalWinner: { type: Number, default: 50 }
  },
  draftOrder: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    position: Number
  }],
  currentWeek: { type: Number, default: 1 }
}, {
  timestamps: true
});

const League = mongoose.models.League || mongoose.model('League', leagueSchema);

export default League;