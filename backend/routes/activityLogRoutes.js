const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityLogController');
const { authenticate, adminOrAbove } = require('../middleware/auth');

router.get('/', authenticate, adminOrAbove, getActivityLogs);

module.exports = router;
