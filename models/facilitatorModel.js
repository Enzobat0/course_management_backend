const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
    const Facilitator = sequelize.define('Facilitator', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  tableName: 'facilitators'
});
return Facilitator;
}




