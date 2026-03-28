const express = require('express');
const { auth, teacherOnly } = require('../middleware/auth');
const { TypingExercise, TypingResult } = require('../models/TypingExercise');
const { LevelProgress } = require('../models/Level');
const { Reward, UserReward } = require('../models/Shop');
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

const judgeContent = (submitted, expected, rule) => {
  const normalizeSimple = (code) => {
    if (!code) return '';
    return code.replace(/\s+/g, ' ').trim().toLowerCase();
  };
  
  console.log('=== JUDGE CONTENT START ===');
  console.log('Original submitted:', JSON.stringify(submitted));
  console.log('Original expected:', JSON.stringify(expected));
  console.log('Judge rule:', rule);
  
  const normalizedSubmitted = normalizeSimple(submitted);
  const normalizedExpected = normalizeSimple(expected);
  
  console.log('Normalized submitted:', JSON.stringify(normalizedSubmitted));
  console.log('Normalized expected:', JSON.stringify(normalizedExpected));
  console.log('Simple match result:', normalizedSubmitted === normalizedExpected);
  
  let result = false;
  switch (rule) {
    case 'exact':
      result = normalizedSubmitted === normalizedExpected;
      console.log('Using exact match rule');
      break;
    case 'ignoreWhitespace':
      const cppSubmitted = normalizeCppCode(submitted);
      const cppExpected = normalizeCppCode(expected);
      console.log('normalizeCpp(submitted):', JSON.stringify(cppSubmitted));
      console.log('normalizeCpp(expected):', JSON.stringify(cppExpected));
      console.log('CPP match result:', cppSubmitted === cppExpected);
      result = cppSubmitted === cppExpected;
      console.log('Using ignoreWhitespace match rule');
      break;
    default:
      result = normalizedSubmitted === normalizedExpected;
      console.log('Using default (exact) match rule');
  }
  
  console.log('=== JUDGE CONTENT END ===');
  console.log('Final result:', result);
  console.log('==========================');
  
  return result;
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
        isCompleted: false,
        bestTimes: [],
        totalAttempts: 0,
        successfulAttempts: 0
      });
      await result.save();
    } else {
      result.completedLines = 0;
      result.isCompleted = false;
      await result.save();
    }

    console.log('=== START EXERCISE ===');
    console.log('result.completedLines:', result.completedLines);
    console.log('result.isCompleted:', result.isCompleted);

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
        isCompleted: result.isCompleted,
        bestTimes: result.bestTimes || [],
        totalAttempts: result.totalAttempts || 0,
        successfulAttempts: result.successfulAttempts || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/submit-line', auth, async (req, res) => {
  try {
    console.log('=== SUBMIT-LINE ROUTE START ===');
    const { lineNumber, submittedContent, hpRemaining, timeSpent } = req.body;
    const exercise = await TypingExercise.findById(req.params.id);
    
    console.log('=== SUBMIT DEBUG ===');
    console.log('req.body:', req.body);
    console.log('lineNumber received:', lineNumber, typeof lineNumber);
    console.log('submittedContent:', submittedContent);
    console.log('submittedContent length:', submittedContent?.length);
    console.log('hpRemaining:', hpRemaining);
    console.log('timeSpent:', timeSpent);
    console.log('exercise._id:', exercise?._id);
    console.log('exercise.questions count:', exercise?.questions?.length);
    console.log('exercise.questions:', exercise?.questions?.map(q => ({ lineNumber: q.lineNumber, answer: q.answer })));
    
    if (!exercise) {
      console.log('ERROR: Exercise not found');
      return res.status(404).json({ message: 'Exercise not found' });
    }

    const question = exercise.questions.find(q => q.lineNumber === Number(lineNumber));
    console.log('found question:', question ? { lineNumber: question.lineNumber, answer: question.answer } : 'NOT FOUND');
    if (!question) {
      console.log('ERROR: Question not found for lineNumber:', lineNumber);
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

    console.log('=== JUDGE RESULT ===');
    console.log('isCorrect:', isCorrect);
    console.log('lineNumber:', lineNumber);
    console.log('result.completedLines before:', result.completedLines);
    console.log('exercise.questions.length:', exercise.questions.length);
    console.log('question.answer:', question.answer);
    console.log('exercise.judgeRule:', exercise.judgeRule);

    if (isCorrect) {
      console.log('=== ANSWER IS CORRECT ===');
      result.completedLines = Math.max(result.completedLines, lineNumber);
      result.totalAttempts = (result.totalAttempts || 0) + 1;
      result.lastAttemptTime = new Date();
      
      console.log('result.completedLines after:', result.completedLines);
      console.log('result.completedLines >= exercise.questions.length:', result.completedLines >= exercise.questions.length);
      
      let totalCoinsEarned = 0;
      let isNewRecord = false;
      let isFirstCompletion = false;
      
      if (result.completedLines >= exercise.questions.length) {
        console.log('=== EXERCISE COMPLETED ===');
        result.isCompleted = true;
        result.timeSpent = timeSpent;
        result.totalTimeSpent = (result.totalTimeSpent || 0) + timeSpent;
        result.successfulAttempts = (result.successfulAttempts || 0) + 1;

        const bestTimes = result.bestTimes || [];
        bestTimes.push(timeSpent);
        bestTimes.sort((a, b) => a - b);
        result.bestTimes = bestTimes.slice(0, 3);

        const previousBest = bestTimes.length > 1 ? bestTimes[0] : Infinity;
        isNewRecord = timeSpent < previousBest && result.successfulAttempts > 1;
        
        isFirstCompletion = result.successfulAttempts === 1;

        await calculateExp(req.user._id, exercise.expReward);
        result.expEarned = exercise.expReward;

        try {
          const user = await User.findById(req.user._id);
          if (user) {
            user.totalExercises += 1;
            
            const rewards = await Reward.find({
              exerciseId: exercise._id,
              isActive: true
            });
            
            for (const reward of rewards) {
              let shouldGiveReward = false;
              
              if (reward.type === 'first_completion' && isFirstCompletion) {
                shouldGiveReward = true;
              } else if (reward.type === 'record_break' && isNewRecord) {
                if (reward.condition?.maxTime && timeSpent <= reward.condition.maxTime) {
                  shouldGiveReward = true;
                } else if (!reward.condition?.maxTime) {
                  shouldGiveReward = true;
                }
              } else if (reward.type === 'exercise_completion') {
                shouldGiveReward = true;
              }
              
              if (shouldGiveReward) {
                const existingUserReward = await UserReward.findOne({
                  user: req.user._id,
                  reward: reward._id
                });
                
                if (!existingUserReward || reward.isRepeatable) {
                  user.coins = (user.coins || 0) + reward.coinsReward;
                  totalCoinsEarned += reward.coinsReward;
                  
                  const userReward = new UserReward({
                    user: req.user._id,
                    reward: reward._id
                  });
                  await userReward.save();
                  
                  console.log(`=== REWARD GIVEN: ${reward.name} ===`);
                  console.log(`Coins: ${reward.coinsReward}`);
                }
              }
            }
            
            await user.save();
            console.log(`=== TOTAL COINS EARNED: ${totalCoinsEarned} ===`);
          }
          
          await updateLevelProgress(req.user._id, exercise._id, 'typing', 100);
        } catch (userError) {
          console.log('=== USER UPDATE ERROR (ignored) ===');
          console.log(userError);
        }
      }
      
      await result.save();

      console.log('=== SENDING CORRECT RESPONSE ===');
      console.log('isCorrect:', true);
      console.log('completedLines:', result.completedLines);
      console.log('isCompleted:', result.isCompleted);
      console.log('expEarned:', result.expEarned || 0);
      console.log('totalCoinsEarned:', totalCoinsEarned || 0);

      res.json({
        success: true,
        isCorrect: true,
        completedLines: result.completedLines,
        totalLines: result.totalLines,
        isCompleted: result.isCompleted,
        expEarned: result.expEarned || 0,
        bestTimes: result.bestTimes || [],
        totalAttempts: result.totalAttempts || 0,
        successfulAttempts: result.successfulAttempts || 0,
        isNewRecord: isNewRecord,
        isFirstCompletion: isFirstCompletion,
        coinsEarned: totalCoinsEarned || 0,
        message: result.isCompleted ? '恭喜完成全部题目！' : '正确，进入下一行'
      });
    } else {
      console.log('=== WRONG ANSWER ===');
      console.log('hpRemaining from frontend:', hpRemaining);
      console.log('exercise.hpDeduction:', exercise.hpDeduction || 1);
      
      const newHpRemaining = hpRemaining - (exercise.hpDeduction || 1);
      
      console.log('newHpRemaining:', newHpRemaining);
      console.log('question.answer:', question.answer);
      console.log('submittedContent:', submittedContent);
      
      result.totalAttempts = (result.totalAttempts || 0) + 1;
      
      if (newHpRemaining <= 0) {
        console.log('=== HP depleted, reset completedLines to 0 ===');
        result.completedLines = 0;
        result.isCompleted = false;
        await result.save();

        console.log('result.completedLines:', result.completedLines);

        console.log('=== SENDING WRONG RESPONSE (HP depleted) ===');
        res.json({
          success: false,
          isCorrect: false,
          hpRemaining: 0,
          completedLines: 0,
          totalLines: exercise.questions.length,
          isCompleted: false,
          correctAnswer: question.answer,
          message: '生命值耗尽，挑战失败'
        });
      } else {
        await result.save();
        
        console.log('=== SENDING WRONG RESPONSE (HP remaining) ===');
        console.log('Sending hpRemaining:', newHpRemaining);
        console.log('Sending completedLines:', result.completedLines);
        res.json({
          success: false,
          isCorrect: false,
          hpRemaining: newHpRemaining,
          completedLines: result.completedLines,
          totalLines: exercise.questions.length,
          isCompleted: false,
          correctAnswer: question.answer,
          message: '答案错误，请重试'
        });
      }
    }
  } catch (error) {
    console.log('=== SUBMIT-LINE ROUTE ERROR ===');
    console.log('Error:', error);
    console.log('Error message:', error.message);
    console.log('Error stack:', error.stack);
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
