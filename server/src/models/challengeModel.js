import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  season: { type: Number, required: [true, 'Please provide a season number'] }, // Comma added here
  week: { type: Number, required: [true, 'Please provide a week number'] },
  title: { type: String, required: [true, 'Please provide a challenge title'] },
  description: { type: String, required: [true, 'Please provide a challenge description'] },
  location: { type: String, required: [true, 'Please provide a location'] },
  isQuickfire: { type: Boolean, default: false },
  guest: { type: String, default: '' },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Chef', default: null },
  topChefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chef' }],
  bottomChefs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chef' }],
  eliminatedChef: { type: mongoose.Schema.Types.ObjectId, ref: 'Chef', default: null },
  airDate: { type: Date, required: [true, 'Please provide an air date'] },
  status: { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' }
}, {
  timestamps: true
});

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;