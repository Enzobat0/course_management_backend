const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  classId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  cohortId: {
    type: DataTypes.UUID,
    allowNull: true,  
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  }
}, {
  tableName: 'students'
});
return Student;
}
