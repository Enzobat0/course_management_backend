const express = require('express');
const dotenv = require('dotenv');
const { sequelize } = require('./models'); 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/moduleRoutes');
const classRoutes = require('./routes/classRoutes');
const facilitatorRoutes = require('./routes/facilitatorRoutes');
const studentRoutes = require('./routes/studentRoutes');
const allocationsRoutes = require('./routes/allocationsRoutes');
const activityTrackerRoutes = require('./routes/activityTrackerRoutes');
const { connectRedis } = require('./config/redisclient');
const { startSchedulers } = require('./tasks/reminderScheduler');

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/facilitators', facilitatorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/activity-tracker', activityTrackerRoutes);
app.use('/api/allocations', allocationsRoutes);



sequelize.sync()
.then(() => {
  console.log('Database synced with user and role models created!');
  return connectRedis();
}).then(() => {
  console.log('Redis client connected successfully!');
  startSchedulers(); 
  app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
})
.catch(err => {
  console.error('Unable to connect to the database:', err);
  process.exit(1);
});

 