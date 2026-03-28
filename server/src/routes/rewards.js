const express = require('express');
const { auth, teacherOnly } = require('../middleware/auth');
const { Reward } = require('../models/Shop');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const rewards = await Reward.find({})
      .populate('exerciseId', 'title')
      .populate('ojProblemId', 'title')
      .sort({ createdAt: -1 });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/exercise/:exerciseId', auth, async (req, res) => {
  try {
    const rewards = await Reward.find({
      exerciseId: req.params.exerciseId,
      isActive: true
    });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', auth, teacherOnly, async (req, res) => {
  try {
    const reward = new Reward({
      ...req.body,
      createdBy: req.user._id
    });
    await reward.save();
    res.status(201).json(reward);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, teacherOnly, async (req, res) => {
  try {
    const reward = await Reward.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    res.json(reward);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', auth, teacherOnly, async (req, res) => {
  try {
    const reward = await Reward.findByIdAndDelete(req.params.id);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    res.json({ message: 'Reward deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/toggle', auth, teacherOnly, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }
    reward.isActive = !reward.isActive;
    await reward.save();
    res.json(reward);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
