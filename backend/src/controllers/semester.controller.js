const prisma = require('../utils/prisma');

const getSemesters = async (req, res, next) => {
  try {
    const semesters = await prisma.semester.findMany({
      where: { user_id: req.user.userId },
      orderBy: { number: 'asc' }
    });
    res.json(semesters);
  } catch (error) {
    next(error);
  }
};

const createSemester = async (req, res, next) => {
  try {
    const { number, title, gpa_target, is_current } = req.body;
    
    const num = parseInt(number, 10);
    const gpa = gpa_target ? parseFloat(gpa_target) : null;

    // If setting as current, unset others
    if (is_current) {
      await prisma.semester.updateMany({
        where: { user_id: req.user.userId, is_current: true },
        data: { is_current: false }
      });
    }

    const semester = await prisma.semester.create({
      data: {
        user: { connect: { id: req.user.userId } },
        number: num || 1,
        title: title || `Semester ${num || 1}`,
        gpa_target: gpa,
        is_current: is_current || false
      }
    });
    res.status(201).json(semester);
  } catch (error) {
    next(error);
  }
};

const updateSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { number, title, gpa_target, is_current } = req.body;

    const semesterId = parseInt(id);

    // Verify ownership
    const existing = await prisma.semester.findFirst({
      where: { id: semesterId, user_id: req.user.userId }
    });
    if (!existing) return res.status(404).json({ error: 'Semester not found' });

    const num = number !== undefined ? parseInt(number, 10) : existing.number;
    const gpa = gpa_target !== undefined ? (gpa_target ? parseFloat(gpa_target) : null) : existing.gpa_target;

    if (is_current) {
      await prisma.semester.updateMany({
        where: { user_id: req.user.userId, is_current: true },
        data: { is_current: false }
      });
    }

    const semester = await prisma.semester.update({
      where: { id: semesterId },
      data: { number: num, title: title || `Semester ${num || 1}`, gpa_target: gpa, is_current }
    });
    res.json(semester);
  } catch (error) {
    next(error);
  }
};

const deleteSemester = async (req, res, next) => {
  try {
    const { id } = req.params;
    const semesterId = parseInt(id);

    // Verify ownership
    const existing = await prisma.semester.findFirst({
      where: { id: semesterId, user_id: req.user.userId }
    });
    if (!existing) return res.status(404).json({ error: 'Semester not found' });

    await prisma.semester.delete({
      where: { id: semesterId }
    });
    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSemesters, createSemester, updateSemester, deleteSemester };
