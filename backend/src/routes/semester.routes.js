const express = require('express');
const { getSemesters, createSemester, updateSemester, deleteSemester } = require('../controllers/semester.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken); // Protect all semester routes

router.get('/', getSemesters);
router.post('/', createSemester);
router.put('/:id', updateSemester);
router.delete('/:id', deleteSemester);

module.exports = router;
