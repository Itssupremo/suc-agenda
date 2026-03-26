const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/dateBoardMeetingController');
const { authenticate, adminOrAbove } = require('../middleware/auth');

router.get('/',     authenticate,              getAll);
router.post('/',    authenticate, adminOrAbove, create);
router.put('/:id',  authenticate,              update);  // users can edit their own
router.delete('/:id', authenticate, adminOrAbove, remove);

module.exports = router;
