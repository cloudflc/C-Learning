const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  lineNumber: { type: Number, required: true },
  prompt: { type: String, required: true },
  answer: { type: String, required: true }
});

const typingExerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  questions: [questionSchema],
  judgeRule: {
    type: String,
    enum: ['exact', 'ignoreWhitespace'],
    default: 'exact'
  },
  initialHp: { type: Number, default: 3 },
  hpDeduction: { type: Number, default: 1 },
  timeLimit: { type: Number, default: 0 },
  expReward: { type: Number, default: 10 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

const typingResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'TypingExercise' },
  completedLines: { type: Number, default: 0 },
  totalLines: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  timeSpent: { type: Number },
  expEarned: { type: Number },
  bestTimes: [{ type: Number }],
  totalAttempts: { type: Number, default: 0 },
  successfulAttempts: { type: Number, default: 0 },
  lastAttemptTime: { type: Date },
  totalTimeSpent: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = {
  TypingExercise: mongoose.model('TypingExercise', typingExerciseSchema),
  TypingResult: mongoose.model('TypingResult', typingResultSchema)
};
