const prisma = require('../utils/prisma');

const getSubjectProgress = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subId = parseInt(subjectId);

    const subject = await prisma.subject.findUnique({
      where: { id: subId },
      include: { semester: true }
    });

    if (!subject || subject.semester.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const contentItems = await prisma.contentItem.findMany({
      where: { subject_id: subId }
    });

    const tasks = await prisma.task.findMany({
      where: { subject_id: subId }
    });

    const contentTotal = contentItems.length;
    const contentCompleted = contentItems.filter(c => c.is_completed).length;
    const contentPercent = contentTotal > 0 ? Math.round((contentCompleted / contentTotal) * 100) : 0;

    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter(t => t.is_complete).length;
    const tasksSubmitted = tasks.filter(t => t.is_submitted).length;
    
    // Pending submit are those that are complete but NOT submitted
    const tasksPendingSubmit = tasks.filter(t => t.is_complete && !t.is_submitted).length;

    res.json({
      contentTotal,
      contentCompleted,
      contentPercent,
      tasksTotal,
      tasksCompleted,
      tasksSubmitted,
      tasksPendingSubmit
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubjectProgress };
