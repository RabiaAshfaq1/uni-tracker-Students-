const express = require('express');
const { getStudySessions, createStudySession, updateStudySession, deleteStudySession } = require('../controllers/studySession.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getStudySessions);
router.post('/', createStudySession);
router.put('/:id', updateStudySession);
router.delete('/:id', deleteStudySession);

module.exports = router;
