const express = require('express');
const router = express.Router();
const { login, loginByEmail, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/login-by-email', loginByEmail);
router.get('/me', authenticate, getMe);

module.exports = router;
