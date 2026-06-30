const express = require('express');
const router = express.Router();
const { getAllUsers, updateUser, updateSelf, createUser, deleteUser } = require('../controllers/userController');
const { authenticate, superAdminOnly, adminOrAbove, managerOrAbove } = require('../middleware/auth');

// Any authenticated user can update their own profile (email, username, password)
router.put('/me', authenticate, updateSelf);

router.get('/',      authenticate, managerOrAbove, getAllUsers);
router.post('/',     authenticate, managerOrAbove, createUser);
router.put('/:id',   authenticate, managerOrAbove, updateUser);
router.delete('/:id',authenticate, managerOrAbove, deleteUser);

module.exports = router;
