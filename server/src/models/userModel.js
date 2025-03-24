import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide a name'], trim: true },
  email: { type: String, required: [true, 'Please provide an email'], unique: true, lowercase: true, match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'] },
  password: { type: String, required: [true, 'Please provide a password'], minlength: [6, 'Password must be at least 6 characters'], select: false },
  avatar: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  leagues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'League' }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;