const express = require('express');
const { auth, teacherOnly } = require('../middleware/auth');
const { TypingExercise, TypingResult } = require('../models/TypingExercise');
const { LevelProgress } = require('../models/Level');
const User = require('../models/User');
const { calculateExp } = require('../services/expService');

const router = express.Router();

const normalizeCppCode = (code) => {
  if (!code) return '';
  let normalized = code;
  
  normalized = normalized.replace(/\/\/.*$/gm, '');
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, '');
  
  normalized = normalized.replace(/'[^']*'/g, "'x'");
  normalized = normalized.replace(/"[^"]*"/g, '"x"');
  
  normalized = normalized.replace(/<</g, ' << ');
  normalized = normalized.replace(/>>/g, ' >> ');
  normalized = normalized.replace(/<=/g, ' <= ');
  normalized = normalized.replace(/>=/g, ' >= ');
  normalized = normalized.replace(/==/g, ' == ');
  normalized = normalized.replace(/!=/g, ' != ');
  normalized = normalized.replace(/&&/g, ' && ');
  normalized = normalized.replace(/\|\|/g, ' || ');
  
  const cppKeywords = [
    'int', 'char', 'float', 'double', 'bool', 'void', 'long', 'short', 'unsigned', 'signed',
    'const', 'static', 'extern', 'register', 'volatile', 'auto',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue', 'return', 'goto',
    'struct', 'class', 'union', 'enum', 'typedef', 'sizeof',
    'public', 'private', 'protected', 'virtual', 'override', 'final',
    'new', 'delete', 'this', 'nullptr', 'true', 'false',
    'namespace', 'using', 'template', 'typename', 'try', 'catch', 'throw',
    'cout', 'cin', 'endl', 'std', 'include', 'define', 'iostream', 'vector', 'string', 'map', 'set'
  ];
  
  normalized = normalized.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
    return cppKeywords.includes(match) ? match : 'VAR';
  });
  
  normalized = normalized.replace(/[0-9]+(\.[0-9]+)?/g, 'NUM');
  
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized.toLowerCase();
};

const updateLevelProgress = async (userId, exerciseId, exerciseType, progressValue) => {
  try {
    const levels = await require('../models/Level').Level.find({});

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

        if (exerciseType === 'typing') {
          progress.typingProgress.set(exerciseId.toString(), progressValue);
        } else {
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

        if (completedCount === allExercises.length) {
          progress.completed = true;
          progress.completedAt = new Date();
        }

        await progress.save();
        break;
      }
    }
  } catch (error) {
    console.error('Error updating level progress:', error);
  }
};

const judgeContent = (submitted, expected, rule) => {
  const normalizeSimple = (code) => {
    if (!code) return '';
    return code.replace(/\s+/g, ' ').trim().toLowerCase();
  };
  
  console.log('=== DEBUG ===');
  console.log('submitted:', JSON.stringify(submitted));
  console.log('expected:', JSON.stringify(expected));
  console.log('rule:', rule);
  console.log('normalizeSimple(submitted):', JSON.stringify(normalizeSimple(submitted)));
  console.log('normalizeSimple(expected):', JSON.stringify(normalizeSimple(expected)));
  console.log('Match:', normalizeSimple(submitted) === normalizeSimple(expected));
  
  switch (rule) {
    case 'exact':
      return normalizeSimple(submitted) === normalizeSimple(expected);
    case 'ignoreWhitespace':
      console.log('normalizeCpp(submitted):', JSON.stringify(normalizeCppCode(submitted)));
      console.log('normalizeCpp(expected):', JSON.stringify(normalizeCppCode(expected)));
      return normalizeCppCode(submitted) === normalizeCppCode(expected);
    default:
      return normalizeSimple(submitted) === normalizeSimple(expected);
  }
};

router.get('/', auth, async (req, res) => {
  try {
    const { difficulty, tags, page = 1, limit = 20 } = req.query;
    const query = { isPublic: true };
    
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };

    const exercises = await TypingExercise.find(query)
      .select('-questions.answer')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await TypingExercise.countDocuments(query);

    res.json({
      exercises,
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

router.get('/:id', auth, async (req, res) => {
  try {
    const exercise = await TypingExercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, teacherOnly, async (req, res) => {
  try {
    const exercise = new TypingExercise(req.body);
    await exercise.save();
    res.status(201).json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, teacherOnly, async (req, res) => {
  try {
    const exercise = await TypingExercise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, teacherOnly, async (req, res) => {
  try {
    const exercise = await TypingExercise.findByIdAndDelete(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/start', auth, async (req, res) => {
  try {
    const exercise = await TypingExercise.findById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    let result = await TypingResult.findOne({
      user: req.user._id,
      exercise: exercise._id
    });

    if (!result) {
      result = new TypingResult({
        user: req.user._id,
        exercise: exercise._id,
        completedLines: 0,
        totalLines: exercise.questions.length,
        isCompleted: false
      });
      await result.save();
    }

    res.json({
      exercise: {
        _id: exercise._id,
        title: exercise.title,
        description: exercise.description,
        questions: exercise.questions.map((q, i) => ({
          lineNumber: q.lineNumber,
          prompt: q.prompt
        })),
        initialHp: exercise.initialHp,
        timeLimit: exercise.timeLimit,
        expReward: exercise.expReward,
        judgeRule: exercise.judgeRule
      },
      result: {
        completedLines: result.completedLines,
        totalLines: result.totalLines,
        isCompleted: result.isCompleted
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/submit-line', auth, async (req, res) => {
  try {
    const { lineNumber, submittedContent, hpRemaining, timeSpent } = req.body;
    const exercise = await TypingExercise.findById(req.params.id);
    
    console.log('=== SUBMIT DEBUG ===');
    console.log('lineNumber received:', lineNumber, typeof lineNumber);
    console.log('exercise questions:', exercise.questions.map(q => ({ lineNumber: q.lineNumber, answer: q.answer })));
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const question = exercise.questions.find(q => q.lineNumber === Number(lineNumber));
    console.log('found question:', question ? question.answer : 'NOT FOUND');
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    let result = await TypingResult.findOne({
      user: req.user._id,
      exercise: exercise._id
    });

    if (!result) {
      result = new TypingResult({
        user: req.user._id,
        exercise: exercise._id,
        completedLines: 0,
        totalLines: exercise.questions.length,
        isCompleted: false
      });
    }

    const isCorrect = judgeContent(submittedContent, question.answer, exercise.judgeRule);

    if (isCorrect) {
      result.completedLines = Math.max(result.completedLines, lineNumber);
      
      if (result.completedLines >= exercise.questions.length) {
        result.isCompleted = true;
        result.timeSpent = timeSpent;

        await calculateExp(req.user._id, exercise.expReward);
        result.expEarned = exercise.expReward;

        const user = await User.findById(req.user._id);
        user.totalExercises += 1;
        await user.save();

        await updateLevelProgress(req.user._id, exercise._id, 'typing', 100);
      }
      
      await result.save();

      res.json({
        success: true,
        isCorrect: true,
        completedLines: result.completedLines,
        totalLines: result.totalLines,
        isCompleted: result.isCompleted,
        expEarned: result.expEarned || 0,
        message: result.isCompleted ? '恭喜完成全部题目！' : '正确，进入下一行'
      });
    } else {
      const newHpRemaining = hpRemaining - (exercise.hpDeduction || 1);
      
      if (newHpRemaining <= 0) {
        result.completedLines = 0;
        result.isCompleted = false;
        await result.save();

        res.json({
          success: false,
          isCorrect: false,
          hpRemaining: 0,
          completedLines: 0,
          isCompleted: false,
          correctAnswer: question.answer,
          message: '生命值耗尽，挑战失败'
        });
      } else {
        res.json({
          success: false,
          isCorrect: false,
          hpRemaining: newHpRemaining,
          completedLines: result.completedLines,
          isCompleted: false,
          correctAnswer: question.answer,
          message: '答案错误，请重试'
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/results', auth, async (req, res) => {
  try {
    const results = await TypingResult.find({ exercise: req.params.id })
      .populate('user', 'username')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
