const express = require('express');
const { auth, teacherOnly } = require('../middleware/auth');
const { Achievement, UserAchievement } = require('../models/Achievement');
const User = require('../models/User');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const achievements = await Achievement.find();
    const userAchievements = await UserAchievement.find({ user: req.user._id })
      .populate('achievement');
    
    const userAchievementIds = userAchievements.map(ua => ua.achievement._id.toString());
    
    const achievementsWithStatus = achievements.map(a => ({
      ...a.toObject(),
      earned: userAchievementIds.includes(a._id.toString()),
      earnedAt: userAchievements.find(ua => ua.achievement._id.toString() === a._id.toString())?.earnedAt
    }));

    res.json(achievementsWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, teacherOnly, async (req, res) => {
  try {
    const achievement = new Achievement(req.body);
    await achievement.save();
    res.status(201).json(achievement);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/check/:id', auth, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    const existingAward = await UserAchievement.findOne({
      user: req.user._id,
      achievement: achievement._id
    });

    if (existingAward) {
      return res.json({ earned: true, message: 'Already earned' });
    }

    let earned = false;
    const { condition } = achievement;

    if (condition.type === 'streak') {
      const user = await User.findById(req.user._id);
      earned = user.consecutiveDays >= condition.target;
    } else if (condition.type === 'total_exercises') {
      const user = await User.findById(req.user._id);
      earned = user.totalExercises >= condition.target;
    } else if (condition.type === 'level_complete') {
      const { LevelProgress } = require('../models/Level');
      const progress = await LevelProgress.findOne({
        user: req.user._id,
        level: condition.targetId,
        completed: true
      });
      earned = !!progress;
    }

    if (earned) {
      const userAchievement = new UserAchievement({
        user: req.user._id,
        achievement: achievement._id
      });
      await userAchievement.save();

      const user = await User.findById(req.user._id);
      user.exp += achievement.expReward;
      user.achievements.push(achievement._id);
      await user.save();

      res.json({ earned: true, expEarned: achievement.expReward });
    } else {
      res.json({ earned: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userAchievements = await UserAchievement.find({ user: req.params.userId })
      .populate('achievement')
      .sort({ earnedAt: -1 });
    
    res.json(userAchievements);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
