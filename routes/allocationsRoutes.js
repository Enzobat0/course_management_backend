const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');
const { verifyToken } = require('../middlewares/verifytoken'); 
const { checkRole } = require('../middlewares/checkRole'); 

// Managers can perform CRUD on allocations
router.post(
  '/',
  verifyToken,
  checkRole(['manager']), 
  allocationController.createAllocation
);

router.get(
  '/',
  verifyToken,
  checkRole(['manager', 'facilitator']), // Managers get all, Facilitators get their own
  allocationController.getAllocations
);

router.get(
  '/:id',
  verifyToken,
  checkRole(['manager', 'facilitator']),
  allocationController.getAllocationById
);

router.put(
  '/:id',
  verifyToken,
  checkRole(['manager']),
  allocationController.updateAllocation
);

router.delete(
  '/:id',
  verifyToken,
  checkRole(['manager']),
  allocationController.deleteAllocation
);

module.exports = router;