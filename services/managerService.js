const { User } = require('../models'); 

async function getManagerEmails() {
  try {
    const managers = await User.findAll({
      where: { role: 'manager' },
      attributes: ['email']
    });
    return managers.map(m => m.email);
  } catch (error) {
    console.error('Error fetching manager emails:', error);
    return [];
  }
}

module.exports = {
  getManagerEmails,
};