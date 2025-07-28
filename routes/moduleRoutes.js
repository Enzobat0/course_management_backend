const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const { verifyToken } = require('../middlewares/verifytoken');
const { checkRole } = require('../middlewares/checkRoles');

// Managers and Admins can perform all CRUD operations on Modules
router.post(
  '/',
  verifyToken,
  checkRole(['manager']),
  moduleController.createModule
);

router.get(
  '/',
  verifyToken,
  checkRole(['manager','facilitator', 'student']), 
  moduleController.getAllModules
);

router.get(
  '/:id',
  verifyToken,
  checkRole(['manager', 'facilitator', 'student']), 
  moduleController.getModuleById
);

router.put(
  '/:id',
  verifyToken,
  checkRole(['manager']),
  moduleController.updateModule
);

router.delete(
  '/:id',
  verifyToken,
  checkRole(['manager']),
  moduleController.deleteModule
);

module.exports = router;