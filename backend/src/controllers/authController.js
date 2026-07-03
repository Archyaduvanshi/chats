const authService = require('../services/authService');

const signup = async (req, res, next) => {
  try {
    const session = await authService.signup(req.body);
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const session = await authService.login(req.body);
    res.json(session);
  } catch (error) {
    next(error);
  }
};

const me = (req, res) => {
  res.json({ user: req.user });
};

const listUsers = async (req, res, next) => {
  try {
    const users = await authService.listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const approveUser = async (req, res, next) => {
  try {
    const user = await authService.approveUser(req.params.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveUser,
  listUsers,
  login,
  me,
  signup,
};
