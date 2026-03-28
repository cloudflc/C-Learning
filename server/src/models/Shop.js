const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['badge', 'avatar', 'title', 'theme'], required: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  stock: { type: Number, default: -1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const purchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopItem', required: true },
  purchasedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const rewardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['exercise_completion', 'record_break', 'achievement', 'first_completion'], required: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'TypingExercise' },
  ojProblemId: { type: mongoose.Schema.Types.ObjectId, ref: 'OJProblem' },
  coinsReward: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true },
  isRepeatable: { type: Boolean, default: false },
  condition: {
    minAttempts: { type: Number, default: 0 },
    maxTime: { type: Number }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const userRewardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reward: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
  earnedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = {
  ShopItem: mongoose.model('ShopItem', shopItemSchema),
  Purchase: mongoose.model('Purchase', purchaseSchema),
  Reward: mongoose.model('Reward', rewardSchema),
  UserReward: mongoose.model('UserReward', userRewardSchema)
};
