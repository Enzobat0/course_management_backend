const { createClient } = require('redis');
require('dotenv').config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  database: process.env.REDIS_DB || 0,
});

redisClient.on('connect', () => {
  console.log('Connected to Redis client!');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

async function connectRedis() {
  if (!redisClient.isReady) {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error('Failed to connect to Redis:', err);
      process.exit(1);
    }
  }
}


module.exports = {
  redisClient,
  connectRedis,
};