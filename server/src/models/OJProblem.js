const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true },
  score: { type: Number, default: 10 },
  isHidden: { type: Boolean, default: false }
});

const ojProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  inputFormat: { type: String },
  outputFormat: { type: String },
  sampleInput: { type: String },
  sampleOutput: { type: String },
  testCases: [testCaseSchema],
  timeLimit: { type: Number, default: 1000 },
  memoryLimit: { type: Number, default: 128 },
  expReward: { type: Number, default: 20 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  tags: [{ type: String }],
  language: { type: String, default: 'cpp' },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

const ojSubmissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  problem: { type: mongoose.Schema.Types.ObjectId, ref: 'OJProblem' },
  level: { type: mongoose.Schema.Types.ObjectId, ref: 'Level' },
  code: { type: String, required: true },
  language: { type: String, default: 'cpp' },
  status: {
    type: String,
    enum: ['pending', 'judging', 'accepted', 'wrong_answer', 'time_limit', 'memory_limit', 'runtime_error', 'compile_error'],
    default: 'pending'
  },
  score: { type: Number, default: 0 },
  testResults: [{
    testCase: { type: Number },
    status: { type: String },
    time: { type: Number },
    memory: { type: Number },
    message: { type: String },
    expected: { type: String },
    actual: { type: String }
  }],
  compileOutput: { type: String },
  expEarned: { type: Number }
}, { timestamps: true });

module.exports = {
  OJProblem: mongoose.model('OJProblem', ojProblemSchema),
  OJSubmission: mongoose.model('OJSubmission', ojSubmissionSchema)
};
