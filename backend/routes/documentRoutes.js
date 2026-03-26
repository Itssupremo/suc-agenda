const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { authenticate } = require('../middleware/auth');
const {
  uploadMiddleware, getDocs, uploadFile, resetFile, serveFile,
} = require('../controllers/documentController');

// allow token via query string for window.open file serving
const authenticateOrQuery = async (req, res, next) => {
  const header = req.headers.authorization;
  const qToken = req.query.token;
  const raw = header?.startsWith('Bearer ') ? header.split(' ')[1] : qToken;
  if (!raw) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

router.get('/file/:docId',              authenticateOrQuery, serveFile);
router.get('/',                         authenticate, getDocs);
router.post('/:sucId/:pageType/:slot',  authenticate, uploadMiddleware, uploadFile);
router.delete('/:sucId/:pageType/:slot', authenticate, resetFile);

module.exports = router;
