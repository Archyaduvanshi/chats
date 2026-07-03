const jwt = require('jsonwebtoken');
const env = require('../config/env');
const authService = require('../services/authService');

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      throw Object.assign(new Error('Login is required.'), { status: 401 });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await authService.findApprovedUserById(payload.id);
    if (!user) {
      throw Object.assign(new Error('User is not approved or no longer exists.'), { status: 401 });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : Object.assign(new Error('Invalid session.'), { status: 401 }));
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    next(Object.assign(new Error('Admin approval is required for this action.'), { status: 403 }));
    return;
  }

  next();
};

module.exports = {
  requireAdmin,
  requireAuth,
};
