const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { getUsers } = require('../controllers/userController');

router.get('/', auth, authorize('admin', 'manager'), getUsers);

module.exports = router;
