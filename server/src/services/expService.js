const User = require('../models/User');
const { RankConfig } = require('../models/Config');

const calculateExp = async (userId, expToAdd) => {
  const user = await User.findById(userId);
  if (!user) return null;

  user.exp += expToAdd;
  await updateRank(user);
  await user.save();

  return user;
};

const updateRank = async (user) => {
  const ranks = await RankConfig.find().sort({ minExp: -1 });
  
  for (const rank of ranks) {
    if (user.exp >= rank.minExp) {
      user.rank = rank.name;
      break;
    }
  }

  return user;
};

const applyExpDecay = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return;

  const daysSinceActive = Math.floor(
    (Date.now() - new Date(user.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActive > 7) {
    const decayPercent = 5;
    const expToDecay = Math.floor(user.exp * (decayPercent / 100));
    user.exp = Math.max(0, user.exp - expToDecay);
    await updateRank(user);
    await user.save();
  }

  return user;
};

module.exports = {
  calculateExp,
  updateRank,
  applyExpDecay
};
