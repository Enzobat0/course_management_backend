const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

module.exports = (sequelize, DataTypes) => {
  const Module = sequelize.define('Module', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    half: {
      type: DataTypes.ENUM('HT1', 'HT2', 'FT'),// HT1: Half Term 1, HT2: Half Term 2, FT: Full Term
      allowNull: false, 
    },
  },
  {
    tableName: 'modules',
  });

  return Module;
};

