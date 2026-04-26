const prisma = require('../utils/prisma');

const getTasks = async (req, res, next) => {
  try {
    const { subjectId } = req.params;

    if (subjectId === 'all') {
      const tasks = await prisma.task.findMany({
        where: { user_id: req.user.userId },
        orderBy: { due_date: 'asc' },
        include: { subject: true }
      });
      return res.json(tasks);
    }

    const subId = parseInt(subjectId, 10);
    if (!subId || isNaN(subId)) {
      return res.status(400).json({ error: 'Valid subjectId is required' });
    }

    // Verify ownership
    const subject = await prisma.subject.findUnique({
      where: { id: subId },
      include: { semester: true }
    });

    if (!subject || subject.semester.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const tasks = await prisma.task.findMany({
      where: { subject_id: subId },
      orderBy: { due_date: 'asc' }
    });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { subject_id, title, type, due_date, priority, notes } = req.body;
    const subId = subject_id ? parseInt(subject_id, 10) : null;

    if (subId && !isNaN(subId)) {
      const subject = await prisma.subject.findUnique({
        where: { id: subId },
        include: { semester: true }
      });
      if (!subject || subject.semester.user_id !== req.user.userId) {
        return res.status(404).json({ error: 'Subject not found' });
      }
    }

    const task = await prisma.task.create({
      data: {
        user: { connect: { id: req.user.userId } },
        ...(subId && !isNaN(subId) ? { subject: { connect: { id: subId } } } : {}),
        title,
        type: type || 'assignment',
        due_date: due_date ? new Date(due_date) : null,
        priority: priority || 'medium',
        notes: notes || null
      }
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);
    const { title, type, due_date, priority, is_complete, is_submitted } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { subject: { include: { semester: true } } }
    });

    if (!task || task.subject.semester.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const data = {
      title: title !== undefined ? title : task.title,
      type: type !== undefined ? type : task.type,
      due_date: due_date !== undefined ? new Date(due_date) : task.due_date,
      priority: priority !== undefined ? priority : task.priority,
      is_complete: is_complete !== undefined ? is_complete : task.is_complete,
      is_submitted: is_submitted !== undefined ? is_submitted : task.is_submitted
    };
    
    // Automatically set submitted_at if marked as submitted
    if (is_submitted && !task.is_submitted) {
      data.submitted_at = new Date();
    } else if (is_submitted === false) {
      data.submitted_at = null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data
    });

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

const submitTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { is_submitted: true, submitted_at: new Date() }
    });

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const taskId = parseInt(id);

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, updateTask, submitTask, deleteTask };
