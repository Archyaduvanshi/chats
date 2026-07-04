const express = require('express');
const roomController = require('../controllers/roomController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', roomController.listRooms);
router.post('/', roomController.createRoom);
router.post('/join', roomController.joinRoom);
router.post('/direct', roomController.createDirectRoom);
router.delete('/direct/:roomId', roomController.removeDirectRoom);

module.exports = router;
