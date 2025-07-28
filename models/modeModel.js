module.exports = (sequelize, DataTypes) => {
  const Mode = sequelize.define('Mode', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.ENUM('Online', 'Hybrid', 'Inperson'), 
      allowNull: false,
    },
  },
   {
    tableName: 'modes',
  });

  return Mode;
};