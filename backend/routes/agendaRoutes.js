const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { authenticate, adminOrAbove } = require('../middleware/auth');
const {
  uploadMiddleware,
  getAgendas,
  getAgendaStatus,
  uploadFiles,
  resetFiles,
  serveFile,
} = require('../controllers/agendaController');

// Middleware that accepts token from Authorization header OR ?token= query param
// Used by the PDF viewer tab opened with window.open(url)
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

// Serve a PDF file (supports ?token= for browser tab opens)
router.get('/file/:agendaId/:type', authenticateOrQuery, serveFile);

// List agendas for SUC + year (authenticated)
router.get('/', authenticate, getAgendas);

// E-Agenda upload status for visible SUCs (authenticated)
router.get('/status', authenticate, getAgendaStatus);

// Upload / update files for a quarter (all authenticated users)
router.post('/:sucId/:quarter', authenticate, uploadMiddleware, uploadFiles);

// Reset (delete) files for a quarter (all authenticated users)
router.delete('/:sucId/:quarter', authenticate, resetFiles);

module.exports = router;
