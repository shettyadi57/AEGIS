// AEGIS — Auth Middleware
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aegis-secret');
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      return res.status(401).json({ error: 'Admin no longer exists' });
    }

    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Optional auth — allows extension to post without JWT
exports.optionalAuth = async (req, res, next) => {
  try {
    const aegisHeader = req.headers['x-aegis-extension'];
    if (aegisHeader === 'sentinel-v1') {
      req.isExtension = true;
      return next();
    }

    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aegis-secret');
      req.admin = await Admin.findById(decoded.id).select('-password');
    }

    next();
  } catch (err) {
    next(); // Allow even on token errors for extension posts
  }
};
