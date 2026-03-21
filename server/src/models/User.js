const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const rankSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minExp: { type: Number, default: 0 },
  icon: { type: String, default: '🥉' },
  color: { type: String, default: '#CD7F32' }
});

const levelStatusSchema = new mongoose.Schema({
  levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Level', required: true },
  status: { type: String, enum: ['locked', 'unlocked', 'completed'], default: 'locked' },
  unlockedAt: { type: Date },
  completedAt: { type: Date }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin'], default: 'student' },
  exp: { type: Number, default: 0 },
  rank: { type: String, default: 'Bronze' },
  lastActiveDate: { type: Date, default: Date.now },
  consecutiveDays: { type: Number, default: 0 },
  totalExercises: { type: Number, default: 0 },
  correctRate: { type: Number, default: 0 },
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  assignedLevels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Level'
  }],
  levelStatuses: [levelStatusSchema],
  notificationSettings: {
    expDecayAlert: { type: Boolean, default: true },
    achievementAlert: { type: Boolean, default: true },
    rankingAlert: { type: Boolean, default: true }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
