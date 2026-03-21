const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: '🏆' },
  condition: {
    type: { type: String, enum: ['streak', 'total_exercises', 'first_ac', 'perfect_typing', 'level_complete'], required: true },
    target: { type: Number },
    targetId: { type: mongoose.Schema.Types.ObjectId }
  },
  expReward: { type: Number, default: 50 }
}, { timestamps: true });

const userAchievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  achievement: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' },
  earnedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  Achievement: mongoose.model('Achievement', achievementSchema),
  UserAchievement: mongoose.model('UserAchievement', userAchievementSchema)
};
