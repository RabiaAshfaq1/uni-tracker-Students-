const prisma = require('../utils/prisma');

const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // 1. Tasks due within 3 days (not submitted)
    const dueSoonTasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        is_submitted: false,
        due_date: {
          gte: now,
          lte: threeDaysFromNow
        }
      },
      include: { subject: true }
    });

    // 2. Tasks completed but NOT submitted
    const unsubmittedTasks = await prisma.task.findMany({
      where: {
        user_id: userId,
        is_complete: true,
        is_submitted: false
      },
      include: { subject: true }
    });

    // 3. Content items not yet completed where related task due date < 3 days
    // We fetch tasks due within 3 days, get their subjects, then find incomplete content for those subjects
    const subjectsWithUpcomingTasks = dueSoonTasks.map(t => t.subject_id).filter(id => id != null);
    
    const pendingContent = await prisma.contentItem.findMany({
      where: {
        subject_id: { in: subjectsWithUpcomingTasks },
        is_completed: false
      },
      include: { subject: true }
    });

    // Also fetch DB notifications just in case there are static ones
    const dbNotifs = await prisma.notification.findMany({
      where: { user_id: userId, is_read: false },
      orderBy: { created_at: 'desc' }
    });

    // Format them
    const formattedNotifications = [
      ...dueSoonTasks.map(t => ({
        id: `task-due-${t.id}`,
        type: 'due_soon',
        message: `Task "${t.title}" is due soon.`,
        subject: t.subject?.name,
        date: t.due_date,
        is_read: false
      })),
      ...unsubmittedTasks.map(t => ({
        id: `task-unsubmitted-${t.id}`,
        type: 'unsubmitted',
        message: `Task "${t.title}" is marked complete but not submitted!`,
        subject: t.subject?.name,
        is_read: false
      })),
      ...pendingContent.map(c => ({
        id: `content-pending-${c.id}`,
        type: 'content_pending',
        message: `Pending content: "${c.title}" for upcoming tasks.`,
        subject: c.subject?.name,
        is_read: false
      })),
      ...dbNotifs.map(n => ({
        id: n.id,
        type: 'system',
        message: n.message,
        is_read: n.is_read
      }))
    ];

    res.json(formattedNotifications);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    // We only mark DB notifications as read
    if (!isNaN(parseInt(id))) {
      const notif = await prisma.notification.update({
        where: { id: parseInt(id) },
        data: { is_read: true }
      });
      return res.json(notif);
    }
    // For dynamic notifications, they naturally disappear when the condition is met
    res.json({ message: 'Dynamic notification acknowledged' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead };
