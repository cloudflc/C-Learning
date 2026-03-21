const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const { TypingResult } = require('../models/TypingExercise');
const { OJSubmission } = require('../models/OJProblem');
const { getCachedRanking, cacheRanking } = require('../config/redis');

const router = express.Router();

const RANKING_TYPES = {
  EXP: 'exp',
  TYPING: 'typing',
  OJ: 'oj'
};

const RANKING_SCOPES = {
  GLOBAL: 'global',
  CLASS: 'class'
};

const getTypingRanking = async (scope, limit = 50) => {
  const cacheKey = `ranking:typing:${scope}`;
  const cached = await getCachedRanking(cacheKey);
  if (cached) return cached;

  const results = await TypingResult.aggregate([
    { $match: { isCorrect: true } },
    { $group: { _id: '$user', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: '$user._id',
        username: '$user.username',
        exp: '$user.exp',
        rank: '$user.rank',
        count: 1
      }
    }
  ]);

  await cacheRanking(cacheKey, results, 3600);
  return results;
};

const getOJRanking = async (scope, limit = 50) => {
  const cacheKey = `ranking:oj:${scope}`;
  const cached = await getCachedRanking(cacheKey);
  if (cached) return cached;

  const results = await OJSubmission.aggregate([
    { $match: { status: 'accepted' } },
    { $group: { _id: '$user', count: { $sum: 1 }, totalScore: { $sum: '$score' } } },
    { $sort: { totalScore: -1, count: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: '$user._id',
        username: '$user.username',
        exp: '$user.exp',
        rank: '$user.rank',
        count: 1,
        totalScore: 1
      }
    }
  ]);

  await cacheRanking(cacheKey, results, 3600);
  return results;
};

const getExpRanking = async (scope, limit = 50) => {
  const cacheKey = `ranking:exp:${scope}`;
  const cached = await getCachedRanking(cacheKey);
  if (cached) return cached;

  const results = await User.find({ role: 'student' })
    .select('username exp rank')
    .sort({ exp: -1 })
    .limit(limit);

  await cacheRanking(cacheKey, results, 3600);
  return results;
};

router.get('/', auth, async (req, res) => {
  try {
    const { type = 'exp', scope = 'global', period = 'all' } = req.query;
    
    let ranking;
    switch (type) {
      case RANKING_TYPES.TYPING:
        ranking = await getTypingRanking(scope);
        break;
      case RANKING_TYPES.OJ:
        ranking = await getOJRanking(scope);
        break;
      case RANKING_TYPES.EXP:
      default:
        ranking = await getExpRanking(scope);
        break;
    }

    const userRank = ranking.findIndex(r => 
      r._id && r._id.toString() === req.user._id.toString()
    );

    res.json({
      ranking,
      userRank: userRank >= 0 ? userRank + 1 : null,
      total: ranking.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/me/rank', auth, async (req, res) => {
  try {
    const expRanking = await getExpRanking('global', 1000);
    const userRank = expRanking.findIndex(r => 
      r._id && r._id.toString() === req.user._id.toString()
    );

    res.json({
      rank: userRank >= 0 ? userRank + 1 : null,
      exp: req.user.exp,
      rankName: req.user.rank
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
