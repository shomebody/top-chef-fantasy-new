import mongoose from 'mongoose';

const chefSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide a chef name'], trim: true },
  bio: { type: String, required: [true, 'Please provide a chef bio'] },
  hometown: { type: String, required: [true, 'Please provide a hometown'] },
  specialty: { type: String, required: [true, 'Please provide a specialty'] },
  image: { type: String, default: '' },
  status: { type: String, enum: ['active', 'eliminated', 'winner'], default: 'active' },
  eliminationWeek: { type: Number, default: null },
  stats: {
    wins: { type: Number, default: 0 },
    eliminations: { type: Number, default: 0 },
    quickfireWins: { type: Number, default: 0 },
    challengeWins: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 }
  },
  weeklyPerformance: [{
    week: Number,
    points: Number,
    rank: Number,
    highlights: String
  }]
}, {
  timestamps: true
});

const Chef = mongoose.models.Chef || mongoose.model('Chef', chefSchema);

export default Chef;