const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notification.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotifications);

router.put('/:id/read', markAsRead);

module.exports = router;
