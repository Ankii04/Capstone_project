const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { getProjectAnalytics, getOverviewAnalytics } = require('../controllers/analyticsController');

router.get('/overview', auth, getOverviewAnalytics);
router.get('/:projectId', auth, getProjectAnalytics);

module.exports = router;
