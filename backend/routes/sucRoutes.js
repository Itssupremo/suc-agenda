const express = require('express');
const router = express.Router();
const {
  getAllSucs,
  getPublicSucs,
  getOccOfficials,
  createSuc,
  updateSuc,
  deleteSuc,
  transferSuc
} = require('../controllers/sucController');
const { authenticate, adminOrAbove, userSectionAccess } = require('../middleware/auth');

// Public routes
router.get('/public', getPublicSucs);
router.get('/occ-officials', getOccOfficials);

// Authenticated routes
router.get('/', authenticate, getAllSucs);
router.post('/', authenticate, userSectionAccess, createSuc);
router.put('/:id', authenticate, userSectionAccess, updateSuc);

// Admin or above routes
router.delete('/:id', authenticate, adminOrAbove, deleteSuc);
router.put('/:id/transfer', authenticate, adminOrAbove, transferSuc);

module.exports = router;
