const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

router.get('/:projectId', auth, getTasks);
router.post('/:projectId', auth, createTask);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);

module.exports = router;