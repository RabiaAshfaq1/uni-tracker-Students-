const express = require('express');
const { getSubjects, createSubject, deleteSubject } = require('../controllers/subject.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken); // Protect all subject routes

router.get('/:semesterId', getSubjects);
router.post('/', createSubject);
router.delete('/:id', deleteSubject);

module.exports = router;
