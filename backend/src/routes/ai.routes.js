const express = require('express');
const { getStudySuggestions, getGpaAdvice } = require('../controllers/ai.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/suggest', getStudySuggestions);
router.post('/gpa-advice', getGpaAdvice);

module.exports = router;
