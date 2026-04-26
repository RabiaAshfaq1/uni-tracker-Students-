require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/error');

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const semesterRoutes = require('./src/routes/semester.routes');
const subjectRoutes = require('./src/routes/subject.routes');
const taskRoutes = require('./src/routes/task.routes');
const gradeRoutes = require('./src/routes/grade.routes');
const contentRoutes = require('./src/routes/content.routes');
const studySessionRoutes = require('./src/routes/studySession.routes');
const aiRoutes = require('./src/routes/ai.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const progressRoutes = require('./src/routes/progress.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Body parser

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/semesters', semesterRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/study-sessions', studySessionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/progress', progressRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'UniTrack API is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export app for serverless deployment (Vercel)
module.exports = app;
