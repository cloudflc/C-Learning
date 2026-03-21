const express = require('express');
const { auth, teacherOnly } = require('../middleware/auth');
const { Level, LevelProgress } = require('../models/Level');
const { TypingExercise, TypingResult } = require('../models/TypingExercise');
const { OJProblem, OJSubmission } = require('../models/OJProblem');

const router = express.Router();

const checkUnlockConditions = async (userId, conditions) => {
  if (!conditions || conditions.length === 0) return true;

  const logic = conditions[0].logic || 'AND';
  const results = [];

  for (const condition of conditions) {
    if (condition.type === 'level') {
      const progress = await LevelProgress.findOne({
        user: userId,
        level: condition.targetId,
        completed: true
      });
      results.push(!!progress);
    } else if (condition.type === 'exercise') {
      if (condition.targetType === 'typing') {
        const result = await TypingResult.findOne({
          user: userId,
          exercise: condition.targetId,
          isCompleted: true
        });
        results.push(!!result);
      } else if (condition.targetType === 'oj') {
        const result = await OJSubmission.findOne({
          user: userId,
          problem: condition.targetId,
          status: 'accepted'
        });
        results.push(!!result);
      }
    }
  }

  if (logic === 'AND') {
    return results.every(r => r);
  } else {
    return results.some(r => r);
  }
};

router.get('/', auth, async (req, res) => {
  try {
    const levels = await Level.find({ isPublic: true }).sort({ order: 1 });

    const levelsWithStatus = await Promise.all(levels.map(async (level) => {
      const isAssigned = req.user.assignedLevels?.includes(level._id) || true;
      const isUnlocked = isAssigned && await checkUnlockConditions(req.user._id, level.unlockConditions);
      const progress = await LevelProgress.findOne({
        user: req.user._id,
        level: level._id
      });

      return {
        ...level.toObject(),
        isAssigned,
        isUnlocked,
        progress: progress || { completed: false }
      };
    }));

    res.json(levelsWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/admin/all', auth, teacherOnly, async (req, res) => {
  try {
    const levels = await Level.find({}).sort({ order: 1 });
    res.json(levels);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const level = await Level.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ message: 'Level not found' });
    }

    const isAssigned = req.user.assignedLevels?.includes(level._id) || true;
    const isUnlocked = isAssigned && await checkUnlockConditions(req.user._id, level.unlockConditions);
    const progress = await LevelProgress.findOne({
      user: req.user._id,
      level: level._id
    });

    const exercisesWithStatus = await Promise.all(level.exercises.map(async (ex) => {
      let exerciseData;
      if (ex.exerciseType === 'typing') {
        exerciseData = await TypingExercise.findById(ex.exerciseId).select('-content');
      } else {
        exerciseData = await OJProblem.findById(ex.exerciseId).select('-testCases');
      }

      const isExerciseUnlocked = await checkUnlockConditions(req.user._id, ex.conditions);

      let status = 'locked';
      let userProgress = 0;
      
      if (isExerciseUnlocked) {
        if (progress) {
          if (ex.exerciseType === 'typing') {
            userProgress = progress.typingProgress?.get(ex.exerciseId.toString()) || 0;
          } else {
            userProgress = progress.ojProgress?.get(ex.exerciseId.toString()) || 0;
          }
        }
        status = userProgress >= 100 ? 'completed' : 'in_progress';
      }

      return {
        ...exerciseData.toObject(),
        type: ex.exerciseType,
        status,
        progress: userProgress,
        isUnlocked: isExerciseUnlocked
      };
    }));

    res.json({
      ...level.toObject(),
      isAssigned,
      isUnlocked,
      progress: progress || { completed: false },
      exercises: exercisesWithStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, teacherOnly, async (req, res) => {
  try {
    const level = new Level(req.body);
    await level.save();
    res.status(201).json(level);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, teacherOnly, async (req, res) => {
  try {
    const level = await Level.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!level) {
      return res.status(404).json({ message: 'Level not found' });
    }
    res.json(level);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, teacherOnly, async (req, res) => {
  try {
    const level = await Level.findByIdAndDelete(req.params.id);
    if (!level) {
      return res.status(404).json({ message: 'Level not found' });
    }
    res.json({ message: 'Level deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/start', auth, async (req, res) => {
  try {
    const level = await Level.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ message: 'Level not found' });
    }

    const isAssigned = req.user.assignedLevels?.includes(level._id) || true;
    if (!isAssigned) {
      return res.status(403).json({ message: 'Level is not assigned to you' });
    }

    const isUnlocked = await checkUnlockConditions(req.user._id, level.unlockConditions);
    if (!isUnlocked) {
      return res.status(403).json({ message: 'Level is locked' });
    }

    let progress = await LevelProgress.findOne({
      user: req.user._id,
      level: level._id
    });

    if (!progress) {
      progress = new LevelProgress({
        user: req.user._id,
        level: level._id,
        typingProgress: new Map(),
        ojProgress: new Map()
      });
      await progress.save();
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/progress', auth, async (req, res) => {
  try {
    const progress = await LevelProgress.findOne({
      user: req.user._id,
      level: req.params.id
    });

    if (!progress) {
      return res.json({ completed: false, startedAt: null });
    }

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
