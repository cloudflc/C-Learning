const express = require('express');
const { auth, teacherOnly } = require('../middleware/auth');
const { OJProblem, OJSubmission } = require('../models/OJProblem');
const { LevelProgress } = require('../models/Level');
const User = require('../models/User');
const { calculateExp } = require('../services/expService');
const { judgeCode } = require('../services/judgeService');

const router = express.Router();

const updateLevelProgress = async (userId, exerciseId, exerciseType, progressValue) => {
  try {
    const { Level } = require('../models/Level');
    const levels = await Level.find({});

    for (const level of levels) {
      const exerciseIndex = level.exercises.findIndex(
        ex => ex.exerciseId.toString() === exerciseId.toString() && ex.exerciseType === exerciseType
      );

      if (exerciseIndex !== -1) {
        let progress = await LevelProgress.findOne({
          user: userId,
          level: level._id
        });

        if (!progress) {
          progress = new LevelProgress({
            user: userId,
            level: level._id,
            typingProgress: new Map(),
            ojProgress: new Map()
          });
        }

        if (exerciseType === 'oj') {
          progress.ojProgress.set(exerciseId.toString(), progressValue);
        }

        const allExercises = level.exercises;
        const completedCount = allExercises.filter(ex => {
          if (ex.exerciseType === 'typing') {
            const p = progress.typingProgress.get(ex.exerciseId.toString()) || 0;
            return p >= 100;
          } else {
            const p = progress.ojProgress.get(ex.exerciseId.toString()) || 0;
            return p >= 100;
          }
        }).length;

        const wasCompleted = progress.completed;
        
        if (completedCount === allExercises.length) {
          progress.completed = true;
          progress.completedAt = new Date();
        }

        await progress.save();

        if (!wasCompleted && progress.completed) {
          const user = await User.findById(userId);
          const levelStatusIndex = user.levelStatuses.findIndex(
            ls => ls.levelId.toString() === level._id.toString()
          );

          if (levelStatusIndex !== -1) {
            user.levelStatuses[levelStatusIndex].status = 'completed';
            user.levelStatuses[levelStatusIndex].completedAt = new Date();
          } else {
            user.levelStatuses.push({
              levelId: level._id,
              status: 'completed',
              unlockedAt: new Date(),
              completedAt: new Date()
            });
          }

          await user.save();
        }

        break;
      }
    }
  } catch (error) {
    console.error('Error updating level progress:', error);
  }
};

router.get('/', auth, async (req, res) => {
  try {
    const { difficulty, tags, page = 1, limit = 20 } = req.query;
    const query = { isPublic: true };
    
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };

    const problems = await OJProblem.find(query)
      .select('-testCases')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await OJProblem.countDocuments(query);

    res.json({
      problems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/detail', auth, teacherOnly, async (req, res) => {
  try {
    const problem = await OJProblem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const problem = await OJProblem.findById(req.params.id).select('-testCases');
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, teacherOnly, async (req, res) => {
  try {
    const problem = new OJProblem(req.body);
    await problem.save();
    res.status(201).json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, teacherOnly, async (req, res) => {
  try {
    const problem = await OJProblem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json(problem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, teacherOnly, async (req, res) => {
  try {
    const problem = await OJProblem.findByIdAndDelete(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }
    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { code, language } = req.body;
    const problem = await OJProblem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const submission = new OJSubmission({
      user: req.user._id,
      problem: problem._id,
      code,
      language: language || 'cpp',
      status: 'pending'
    });

    await submission.save();

    judgeCode(submission._id, problem).then(async (result) => {
      const updatedSubmission = await OJSubmission.findById(submission._id);
      
      let expEarned = 0;
      if (result.status === 'accepted') {
        expEarned = problem.expReward;
        await calculateExp(req.user._id, expEarned);
        await updateLevelProgress(req.user._id, problem._id, 'oj', 100);
      } else if (result.score > 0) {
        expEarned = Math.floor(problem.expReward * (result.score / 100));
        await calculateExp(req.user._id, expEarned);
      }

      updatedSubmission.expEarned = expEarned;
      await updatedSubmission.save();

      const user = await User.findById(req.user._id);
      user.totalExercises += 1;
      await user.save();
    }).catch(async (error) => {
      console.error('Judge error:', error);
      const updatedSubmission = await OJSubmission.findById(submission._id);
      if (updatedSubmission) {
        updatedSubmission.status = 'runtime_error';
        updatedSubmission.score = 0;
        updatedSubmission.compileOutput = error.message;
        await updatedSubmission.save();
      }
    });

    res.json({
      message: 'Submission received',
      submissionId: submission._id,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/submissions', auth, async (req, res) => {
  try {
    const submissions = await OJSubmission.find({ 
      problem: req.params.id,
      user: req.user._id 
    })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/run', auth, async (req, res) => {
  try {
    const { code, input } = req.body;
    const problem = await OJProblem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const testInput = input || problem.sampleInput || '';
    
    console.log('=== RUN CODE DEBUG ===');
    console.log('code length:', code?.length);
    console.log('input:', testInput);
    
    const { executeCode } = require('../services/judgeService');
    try {
      const result = await executeCode(code, testInput, 'cpp');
      console.log('result:', result);
      
      res.json({
        success: true,
        output: result.output,
        error: result.error,
        time: result.time,
        memory: result.memory
      });
    } catch (execError) {
      console.error('executeCode error:', execError);
      res.status(500).json({ message: '运行失败', error: execError.message });
    }
  } catch (error) {
    res.status(500).json({ message: '运行失败', error: error.message });
  }
});

router.get('/submission/:id', auth, async (req, res) => {
  try {
    const submission = await OJSubmission.findById(req.params.id)
      .populate('user', 'username')
      .populate('problem', 'title');
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.user._id.toString() !== req.user._id.toString() && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.user._id);
    
    const response = submission.toObject();
    response.totalExp = user.exp;
    response.currentRank = user.rank;
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
