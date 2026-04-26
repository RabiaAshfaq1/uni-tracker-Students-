const prisma = require('../utils/prisma');

const getStudySessions = async (req, res, next) => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { user_id: req.user.userId },
      include: { subject: true },
      orderBy: { date: 'asc' }
    });
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

const createStudySession = async (req, res, next) => {
  try {
    const { subject_id, title, date, duration_minutes, notes } = req.body;

    // Verify subject ownership if subject is linked
    if (subject_id) {
      const subject = await prisma.subject.findUnique({
        where: { id: parseInt(subject_id) },
        include: { semester: true }
      });

      if (!subject || subject.semester.user_id !== req.user.userId) {
        return res.status(404).json({ error: 'Subject not found' });
      }
    }
    const data = {
      user: { connect: { id: req.user.userId } },
      title,
      date: new Date(date),
      duration_minutes: parseInt(duration_minutes) || 60,
      notes
    };
    
    if (subject_id) {
      data.subject = { connect: { id: parseInt(subject_id) } };
    }

    const session = await prisma.studySession.create({ data });

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

const updateStudySession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, date, duration_minutes, notes, is_completed } = req.body;

    const session = await prisma.studySession.findUnique({
      where: { id: parseInt(id) }
    });

    if (!session || session.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    const updated = await prisma.studySession.update({
      where: { id: parseInt(id) },
      data: {
        title: title !== undefined ? title : session.title,
        date: date !== undefined ? new Date(date) : session.date,
        duration_minutes: duration_minutes !== undefined ? parseInt(duration_minutes) : session.duration_minutes,
        notes: notes !== undefined ? notes : session.notes,
        is_completed: is_completed !== undefined ? is_completed : session.is_completed
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteStudySession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await prisma.studySession.findUnique({
      where: { id: parseInt(id) }
    });

    if (!session || session.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Study session not found' });
    }

    await prisma.studySession.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Study session deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStudySessions, createStudySession, updateStudySession, deleteStudySession };
