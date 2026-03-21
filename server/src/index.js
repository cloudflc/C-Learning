require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const levelRoutes = require('./routes/levels');
const typingRoutes = require('./routes/typing');
const ojRoutes = require('./routes/oj');
const rankingRoutes = require('./routes/ranking');
const achievementRoutes = require('./routes/achievements');
const { initRedis } = require('./config/redis');
const { expDecayJob } = require('./jobs/expDecay');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/typing', typingRoutes);
app.use('/api/oj', ojRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/achievements', achievementRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    initRedis();

    cron.schedule('0 0 * * *', expDecayJob);

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
