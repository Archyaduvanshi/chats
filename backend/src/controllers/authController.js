const authService = require('../services/authService');

const signup = async (req, res, next) => {
  try {
    const session = await authService.signup(req.body);
    res.cookie('token', session.token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const session = await authService.login(req.body);
    res.cookie('token', session.token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(session);
  } catch (error) {
    next(error);
  }
};

const me = (req, res) => {
  res.json({ user: req.user });
};

module.exports = {
  login,
  me,
  signup,
};
