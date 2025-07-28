const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken } = require('../middlewares/verifytoken');
const { checkRole } = require('../middlewares/checkRole');


router.post(
  '/',
  verifyToken,
  checkRole(['manager']),
  classController.createClass
);

router.get(
  '/',
  verifyToken,
  checkRole(['manager', 'facilitator', 'student']), 
  classController.getAllClasses
);

router.get(
  '/:id',
  verifyToken,
  checkRole(['manager', 'facilitator', 'student']), 
  classController.getClassById
);

router.put(
  '/:id',
  verifyToken,
  checkRole(['manager']),
  classController.updateClass
);

router.delete(
  '/:id',
  verifyToken,
  checkRole(['manager']),
  classController.deleteClass
);

module.exports = router;