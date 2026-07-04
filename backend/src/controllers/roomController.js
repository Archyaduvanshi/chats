const roomService = require('../services/roomService');

const listRooms = async (req, res, next) => {
  try {
    const rooms = await roomService.listRoomsForUser(req.user);
    res.json({ rooms });
  } catch (error) {
    next(error);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.body, req.user);
    res.status(201).json({ room });
  } catch (error) {
    next(error);
  }
};

const joinRoom = async (req, res, next) => {
  try {
    const room = await roomService.joinRoom(req.body, req.user);
    res.json({ room });
  } catch (error) {
    next(error);
  }
};

const createDirectRoom = async (req, res, next) => {
  try {
    const room = await roomService.createDirectRoom(req.body, req.user);
    res.status(201).json({ room });
  } catch (error) {
    next(error);
  }
};

const removeDirectRoom = async (req, res, next) => {
  try {
    const result = await roomService.removeDirectRoomForUser(req.params.roomId, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDirectRoom,
  createRoom,
  joinRoom,
  listRooms,
  removeDirectRoom,
};
