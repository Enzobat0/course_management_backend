const express = require('express');
const dotenv = require('dotenv');
const { sequelize } = require('./models'); 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/moduleRoutes');
const classRoutes = require('./routes/classRoutes');

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/classes', classRoutes);



sequelize.sync()
.then(() => {
  console.log('Database synced with user and role models created!');
})
.catch(err => {
  console.error('Unable to connect to the database:', err);
});

 app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});