module.exports = (sequelize, DataTypes) => {
  const ActivityTracker = sequelize.define('ActivityTracker', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    allocationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    attendance: {
      type: DataTypes.JSON,
      allowNull: true, 
      defaultValue: [], 
    },
    weekNumber: { 
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    formativeOneGrading: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started',
    },
    formativeTwoGrading: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started',
    },
    summativeGrading: { 
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started',
    },
    courseModeration: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started',
    },
    intranetSync: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started',
    },
    gradeBookStatus: {
      type: DataTypes.ENUM('Done', 'Pending', 'Not Started'),
      allowNull: false,
      defaultValue: 'Not Started',
    },   
  }, {
    tableName: 'activity_trackers', 
    timestamps: true,
  });

  return ActivityTracker;
};