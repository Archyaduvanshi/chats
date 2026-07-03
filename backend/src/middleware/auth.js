const jwt = require('jsonwebtoken');
const env = require('../config/env');
const authService = require('../services/authService');

const requireAuth = async (req, res, next) => {
  try {
    const token = authService.normalizeToken(
      req.headers.authorization || req.headers['x-access-token'] || req.cookies?.token || ''
    );
    const user = await authService.getUserFromToken(token);

    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : Object.assign(new Error('Invalid session.'), { status: 401 }));
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    next(Object.assign(new Error('Admin access is required for this action.'), { status: 403 }));
    return;
  }

  next();
};

module.exports = {
  requireAdmin,
  requireAuth,
};
