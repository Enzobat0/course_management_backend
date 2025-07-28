module.exports = (sequelize, DataTypes) => {
  const Cohort = sequelize.define('Cohort', {
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
  },
   {
    tableName: 'cohorts',
  });

  return Cohort;
};
