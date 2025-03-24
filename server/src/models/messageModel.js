import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: [true, 'Please provide message content'] },
  type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
  reactions: {
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    hearts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;