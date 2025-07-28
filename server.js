const express = require('express');
const dotenv = require('dotenv');
const { sequelize } = require('./models'); 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const authRoutes = require('./routes/auth');

app.use(express.json());
app.use('/api/auth', authRoutes);




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