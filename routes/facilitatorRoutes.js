const express = require('express');
const router = express.Router();
const facilitatorController = require('../controllers/facilitatorController');
const { verifyToken } = require('../middlewares/verifytoken');
const { checkRole } = require('../middlewares/checkRole');


// Get All Facilitators 
router.get(
  '/',
  verifyToken,
  checkRole(['manager', 'facilitator', 'student']),
  facilitatorController.getAllFacilitators
);

// Get Facilitator by ID 
router.get(
  '/:id',
  verifyToken,
  checkRole(['manager', 'facilitator', ]),
  facilitatorController.getFacilitatorById
);

// Update Facilitator
router.put(
  '/:id',
  verifyToken,
  checkRole(['manager', 'facilitator']),
  facilitatorController.updateFacilitator
);

// Delete Facilitator
router.delete(
  '/:id',
  verifyToken,
  checkRole(['manager']),
  facilitatorController.deleteFacilitator
);

module.exports = router;