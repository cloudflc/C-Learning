const express = require('express');
const { auth, teacherOnly } = require('../middleware/auth');
const { ShopItem, Purchase, Reward, UserReward } = require('../models/Shop');
const User = require('../models/User');

const router = express.Router();

router.get('/items', auth, async (req, res) => {
  try {
    const items = await ShopItem.find({ isActive: true }).sort({ price: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/items', auth, teacherOnly, async (req, res) => {
  try {
    const item = new ShopItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/items/:id', auth, teacherOnly, async (req, res) => {
  try {
    const item = await ShopItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/items/:id', auth, teacherOnly, async (req, res) => {
  try {
    const item = await ShopItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/purchase/:itemId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const item = await ShopItem.findById(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    if (!item.isActive) {
      return res.status(400).json({ message: 'Item is not available' });
    }
    
    if (item.stock > 0 && item.stock !== -1) {
      return res.status(400).json({ message: 'Item is out of stock' });
    }
    
    if (user.coins < item.price) {
      return res.status(400).json({ message: 'Insufficient coins' });
    }
    
    const existingPurchase = await Purchase.findOne({ 
      user: req.user._id,
      item: item._id 
    });
    
    if (existingPurchase) {
      return res.status(400).json({ message: 'Already purchased' });
    }
    
    user.coins -= item.price;
    await user.save();
    
    const purchase = new Purchase({
      user: req.user._id,
      item: item._id
    });
    await purchase.save();
    
    res.json({ message: 'Purchase successful', coins: user.coins });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/purchases', auth, async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user._id })
      .populate('item')
      .sort({ purchasedAt: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/rewards', auth, teacherOnly, async (req, res) => {
  try {
    const rewards = await Reward.find({}).sort({ createdAt: -1 });
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/rewards', auth, teacherOnly, async (req, res) => {
  try {
    const reward = new Reward(req.body);
    await reward.save();
    res.status(201).json(reward);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/rewards/:id', auth, teacherOnly, async (req, res) => {
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

router.delete('/rewards/:id', auth, teacherOnly, async (req, res) => {
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

router.get('/my-rewards', auth, async (req, res) => {
  try {
    const userRewards = await UserReward.find({ user: req.user._id })
      .populate('reward')
      .sort({ earnedAt: -1 });
    res.json(userRewards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
