const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


module.exports = (sequelize, DataTypes) => {
  const Allocation = sequelize.define('Allocation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    moduleId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    classId: {
        type:DataTypes.UUID,
        allowNull: false,
    },
    facilitatorId: {
        type: DataTypes.UUID,
        allowNull: false,

    },
    modeId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    trimester: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
   {
    tableName: 'allocations',});

  return Allocation;
};
