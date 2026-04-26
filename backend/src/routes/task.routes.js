const express = require('express');
const { getTasks, createTask, updateTask, submitTask, deleteTask } = require('../controllers/task.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken); // Protect all task routes

router.get('/:subjectId', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/submit', submitTask);
router.delete('/:id', deleteTask);

module.exports = router;
