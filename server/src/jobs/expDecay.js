const User = require('../models/User');
const { RankConfig } = require('../models/Config');

const expDecayJob = async () => {
  try {
    console.log('Running exp decay job...');
    
    const users = await User.find({ role: 'student' });
    const decayDays = parseInt(process.env.EXP_DECAY_DAYS) || 7;
    const decayPercent = parseInt(process.env.EXP_DECAY_PERCENT) || 5;

    for (const user of users) {
      const daysSinceActive = Math.floor(
        (Date.now() - new Date(user.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActive > decayDays) {
        const expToDecay = Math.floor(user.exp * (decayPercent / 100));
        user.exp = Math.max(0, user.exp - expToDecay);

        const ranks = await RankConfig.find().sort({ minExp: -1 });
        for (const rank of ranks) {
          if (user.exp >= rank.minExp) {
            user.rank = rank.name;
            break;
          }
        }

        await user.save();
        console.log(`Decayed ${expToDecay} exp from user ${user.username}`);
      }
    }

    console.log('Exp decay job completed');
  } catch (error) {
    console.error('Exp decay job failed:', error);
  }
};

module.exports = { expDecayJob };
