const express = require('express');
const router = express.Router();
const { getAllUsers, updateUser, updateSelf, createUser, deleteUser } = require('../controllers/userController');
const { authenticate, superAdminOnly, adminOrAbove } = require('../middleware/auth');

// Any authenticated user can update their own profile (email, username, password)
router.put('/me', authenticate, updateSelf);

router.get('/',      authenticate, adminOrAbove, getAllUsers);
router.post('/',     authenticate, adminOrAbove, createUser);
router.put('/:id',   authenticate, adminOrAbove, updateUser);
router.delete('/:id',authenticate, adminOrAbove, deleteUser);

module.exports = router;
