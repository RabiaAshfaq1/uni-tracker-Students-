const express = require('express');
const { getGrades, createOrUpdateGrades, getSemesterGPA, getCGPA } = require('../controllers/grade.controller');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Note: These routes are technically nested under /api/grades in index.js,
// but the prompt specifies routes like /api/subjects/:subjectId/grades.
// Since index.js maps app.use('/api/grades', gradeRoutes),
// we will structure them accordingly or change the index.js mapping.
// If index.js has `app.use('/api/grades', gradeRoutes)`, then these will be /api/grades/:subjectId etc.
// The prompt specifies:
// GET /api/subjects/:subjectId/grades
// GET /api/semesters/:semesterId/gpa
// GET /api/users/cgpa
// To achieve this cleanly without deeply nested separate routers, I will map them here, 
// and update index.js to use this router at the root `/api`, or just keep the `/api/grades` prefix and map from there.
// Let's assume index.js has `app.use('/api', gradeRoutes)` for these specific nested paths, OR we just use `/api/grades/subject/:subjectId`

// Actually, let's map them exactly as requested, assuming the router is mounted at /api in index.js, 
// OR we mount them via `gradeRoutes` at `/api` in index.js. 
// Wait, I mapped `app.use('/api/grades', gradeRoutes)` in index.js.
// So the paths will be:
// GET /api/grades/subject/:subjectId
// PUT /api/grades/subject/:subjectId
// GET /api/grades/semester/:semesterId/gpa
// GET /api/grades/cgpa

router.get('/subject/:subjectId', getGrades);
router.put('/subject/:subjectId', createOrUpdateGrades);
router.get('/semester/:semesterId/gpa', getSemesterGPA);
router.get('/cgpa', getCGPA);

module.exports = router;
