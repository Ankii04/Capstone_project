const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { getComments, createComment, deleteComment } = require('../controllers/commentController');

router.get('/task/:taskId', auth, getComments);
router.post('/task/:taskId', auth, createComment);
router.delete('/:id', auth, deleteComment);

module.exports = router;
