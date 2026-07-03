const express = require('express');
const {
  approveUser,
  listUsers,
  login,
  me,
  signup,
} = require('../controllers/authController');
const { requireAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.get('/users', requireAuth, requireAdmin, listUsers);
router.patch('/users/:id/approve', requireAuth, requireAdmin, approveUser);

module.exports = router;
