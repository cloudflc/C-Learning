const mongoose = require('mongoose');

const unlockConditionSchema = new mongoose.Schema({
  type: { type: String, enum: ['level', 'exercise', 'exp', 'achievement'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetType: { type: String },
  logic: { type: String, enum: ['AND', 'OR'], default: 'AND' }
});

const exerciseUnlockSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, required: true },
  exerciseType: { type: String, enum: ['typing', 'oj'], required: true },
  conditions: [unlockConditionSchema],
  progressThreshold: { type: Number, default: 0 }
});

const levelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  coverImage: { type: String },
  unlockConditions: [unlockConditionSchema],
  exercises: [exerciseUnlockSchema],
  order: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

const levelProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  level: { type: mongoose.Schema.Types.ObjectId, ref: 'Level' },
  typingProgress: { type: Map, of: Number },
  ojProgress: { type: Map, of: Number },
  completed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = {
  Level: mongoose.model('Level', levelSchema),
  LevelProgress: mongoose.model('LevelProgress', levelProgressSchema)
};
