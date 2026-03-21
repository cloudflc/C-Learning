const { createClient } = require('redis');

let redisClient = null;
let redisEnabled = false;
let redisInitAttempted = false;

const initRedis = async () => {
  if (redisInitAttempted) return null;
  redisInitAttempted = true;
  
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      if (redisEnabled) {
        redisEnabled = false;
        console.warn('Redis disconnected, continuing without cache');
      }
    });
    
    await redisClient.connect();
    redisEnabled = true;
    console.log('✅ Redis connected successfully');
    return redisClient;
  } catch (error) {
    redisEnabled = false;
    console.warn('⚠️ Redis not available, continuing without cache');
    return null;
  }
};

const getRedisClient = () => redisClient;

const cacheRanking = async (key, data, expireSeconds = 3600) => {
  if (!redisEnabled || !redisClient) return;
  try {
    await redisClient.setEx(key, expireSeconds, JSON.stringify(data));
  } catch (error) {
    console.error('Cache ranking error:', error);
  }
};

const getCachedRanking = async (key) => {
  if (!redisEnabled || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Get cached ranking error:', error);
    return null;
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  cacheRanking,
  getCachedRanking
};
