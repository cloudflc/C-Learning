const express = require('express');
const { auth, teacherOnly } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (req.user.role !== 'admin') {
      query.role = 'student';
    }

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ exp: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
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

router.get('/students', auth, teacherOnly, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .populate('assignedLevels', 'name order')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, teacherOnly, async (req, res) => {
  try {
    const { username, email, password, assignedLevels } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const user = new User({
      username,
      email,
      password,
      role: 'student',
      assignedLevels: assignedLevels || []
    });

    await user.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json(userObj);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      exp: user.exp,
      rank: user.rank,
      totalExercises: user.totalExercises,
      correctRate: user.correctRate,
      consecutiveDays: user.consecutiveDays,
      achievements: user.achievements
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, teacherOnly, async (req, res) => {
  try {
    const allowedUpdates = ['role', 'exp', 'rank'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/levels', auth, teacherOnly, async (req, res) => {
  try {
    const { assignedLevels } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { assignedLevels },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id/level-status', auth, teacherOnly, async (req, res) => {
  try {
    const { levelId, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const levelStatusIndex = user.levelStatuses.findIndex(
      ls => ls.levelId.toString() === levelId
    );

    if (levelStatusIndex !== -1) {
      user.levelStatuses[levelStatusIndex].status = status;
      if (status === 'unlocked') {
        user.levelStatuses[levelStatusIndex].unlockedAt = new Date();
      } else if (status === 'completed') {
        user.levelStatuses[levelStatusIndex].completedAt = new Date();
      }
    } else {
      user.levelStatuses.push({
        levelId,
        status,
        unlockedAt: status === 'unlocked' ? new Date() : null,
        completedAt: status === 'completed' ? new Date() : null
      });
    }

    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
