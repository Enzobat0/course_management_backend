const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const UserModel = require('./userModel');
const ManagerModel = require('./managerModel');
const FacilitatorModel = require('./facilitatorModel');
const StudentModel = require('./studentModel');
const ModuleModel = require('./moduleModel');
const ClassModel = require('./classModel');
const CohortModel = require('./cohortModel');
const ModeModel = require('./modeModel');
const AllocationModel = require('./allocationsModel');
const ActivityTrackerModel = require('./activityTrackerModel');

// 🔄 Initialize models
const User = UserModel(sequelize, Sequelize.DataTypes);
const Manager = ManagerModel(sequelize, Sequelize.DataTypes);
const Facilitator = FacilitatorModel(sequelize, Sequelize.DataTypes);
const Student = StudentModel(sequelize, Sequelize.DataTypes);
const Module = ModuleModel(sequelize, Sequelize.DataTypes);
const Class = ClassModel(sequelize, Sequelize.DataTypes);
const Cohort = CohortModel(sequelize, Sequelize.DataTypes);
const Mode = ModeModel(sequelize, Sequelize.DataTypes);
const Allocation = AllocationModel(sequelize, Sequelize.DataTypes);
const ActivityTracker = ActivityTrackerModel(sequelize, Sequelize.DataTypes);



//Define Relationships

// ─── User ───────────────────────────────────────────────
User.hasOne(Manager, { foreignKey: 'userId' });
Manager.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Facilitator, { foreignKey: 'userId' });
Facilitator.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Student, { foreignKey: 'userId' });
Student.belongsTo(User, { foreignKey: 'userId' });

// ─── Manager ↔ Facilitators ─────────────────────────────
Manager.hasMany(Facilitator, { foreignKey: 'managerId' });
Facilitator.belongsTo(Manager, { foreignKey: 'managerId' });

// ─── Student ↔ Class & Cohort ───────────────────────────
Class.hasMany(Student, { foreignKey: 'classId' });
Student.belongsTo(Class, { foreignKey: 'classId' });

Cohort.hasMany(Student, { foreignKey: 'cohortId' });
Student.belongsTo(Cohort, { foreignKey: 'cohortId' });

// ─── Allocation Relationships ───────────────────────────
Module.hasMany(Allocation, { foreignKey: 'moduleId' });
Allocation.belongsTo(Module, { foreignKey: 'moduleId' });

Class.hasMany(Allocation, { foreignKey: 'classId' });
Allocation.belongsTo(Class, { foreignKey: 'classId' });

Facilitator.hasMany(Allocation, { foreignKey: 'facilitatorId' });
Allocation.belongsTo(Facilitator, { foreignKey: 'facilitatorId' });

Mode.hasMany(Allocation, { foreignKey: 'modeId' });
Allocation.belongsTo(Mode, { foreignKey: 'modeId' });

// ─── ActivityTracker Relationships ───────────────────────────
Allocation.hasMany(ActivityTracker, { foreignKey: 'allocationId' });
ActivityTracker.belongsTo(Allocation, { foreignKey: 'allocationId' });


//Export all models
module.exports = {
  sequelize,
  Sequelize,
  User,
  Manager,
  Facilitator,
  Student,
  Module,
  Class,
  Cohort,
  Mode,
  Allocation,
  ActivityTracker
};
