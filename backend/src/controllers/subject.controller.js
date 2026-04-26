const prisma = require('../utils/prisma');

const getSubjects = async (req, res, next) => {
  try {
    const { semesterId } = req.params;
    const semId = parseInt(semesterId);

    // Verify semester belongs to user
    const semester = await prisma.semester.findFirst({
      where: { id: semId, user_id: req.user.userId }
    });
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    const subjects = await prisma.subject.findMany({
      where: { semester_id: semId }
    });
    res.json(subjects);
  } catch (error) {
    next(error);
  }
};

const createSubject = async (req, res, next) => {
  try {
    const { semester_id, name, credit_hours } = req.body;
    const semId = parseInt(semester_id, 10);
    const credits = parseInt(credit_hours, 10);

    if (!semId || isNaN(semId)) {
      return res.status(400).json({ error: 'Valid semester_id is required' });
    }

    // Verify semester belongs to user
    const semester = await prisma.semester.findFirst({
      where: { id: semId, user_id: req.user.userId }
    });
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    const subject = await prisma.subject.create({
      data: { semester: { connect: { id: semId } }, name, credit_hours: credits || 3 }
    });
    res.status(201).json(subject);
  } catch (error) {
    next(error);
  }
};

const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subjectId = parseInt(id);

    // Get subject and verify ownership via semester
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { semester: true }
    });

    if (!subject || subject.semester.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    await prisma.subject.delete({
      where: { id: subjectId }
    });
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSubjects, createSubject, deleteSubject };
