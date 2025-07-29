
const express = require('express');
const router = express.Router();
const activityTrackerController = require('../controllers/activityTrackerController');
const { verifyToken } = require('../middlewares/verifytoken');
const { checkRole } = require('../middlewares/checkRole');

// Create Activity Log
router.post(
  '/',
  verifyToken,
  checkRole(['facilitator']),
  activityTrackerController.createActivityLog
);

// Get All Activity Logs 
router.get(
  '/',
  verifyToken,
  checkRole(['facilitator', 'manager']),
  activityTrackerController.getAllActivityLogs
);

// Get Activity Log by ID 
router.get(
  '/:id',
  verifyToken,
  checkRole(['facilitator', 'manager']),
  activityTrackerController.getActivityLogById
);

// Update Activity Log 
router.put(
  '/:id',
  verifyToken,
  checkRole(['facilitator', 'manager']),
  activityTrackerController.updateActivityLog
);

// Delete Activity Log 
router.delete(
  '/:id',
  verifyToken,
  checkRole(['facilitator', 'manager']),
  activityTrackerController.deleteActivityLog
);

module.exports = router;