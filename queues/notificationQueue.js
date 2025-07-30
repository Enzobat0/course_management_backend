const Queue = require('bull');
const { redisClient } = require('../config/redisclient'); 

const notificationQueue = new Queue('notifications', {
  redis: {
    client: redisClient, 
  },
  defaultJobOptions: {
    attempts: 3, 
    backoff: {
      type: 'exponential',
      delay: 1000, 
    },
  },
});


notificationQueue.on('completed', (job) => {
  console.log(`Job ${job.id} (${job.data.type}) completed`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} (${job.data.type}) failed: ${err.message}`);
});

module.exports = notificationQueue;