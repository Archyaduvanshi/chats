const express = require('express');
const {
  createDirectRoom,
  createRoom,
  joinRoom,
  listRooms,
} = require('../controllers/roomController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', listRooms);
router.post('/', createRoom);
router.post('/join', joinRoom);
router.post('/direct', createDirectRoom);

module.exports = router;
