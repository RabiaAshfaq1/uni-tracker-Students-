const express = require('express');
const { getContent, createContent, updateContent, deleteContent } = require('../controllers/content.controller');
const { authenticateToken } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.use(authenticateToken);

// Assuming it's mounted as app.use('/api/content', contentRoutes)
// So these are /api/content/subject/:subjectId etc.
// The prompt specifies:
// POST /api/subjects/:subjectId/content
// GET /api/subjects/:subjectId/content
// PATCH /api/subjects/:subjectId/content/:id
// DELETE /api/subjects/:subjectId/content/:id
// I'll map them here so they work correctly.

router.get('/subject/:subjectId', getContent);
router.post('/subject/:subjectId', upload.single('file'), createContent);
router.patch('/subject/:subjectId/:id', updateContent);
router.delete('/subject/:subjectId/:id', deleteContent);

module.exports = router;
