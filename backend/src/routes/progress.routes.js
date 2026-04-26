const express = require('express');
const { getSubjectProgress } = require('../controllers/progress.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/:subjectId', getSubjectProgress);

module.exports = router;
